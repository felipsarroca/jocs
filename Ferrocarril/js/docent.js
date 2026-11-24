/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Panell del professorat: s'hi entra amb el codi de la tanda i la contrasenya del professorat.
   Crea la tanda amb el calendari de les quatre trobades (els blocs i la via tallada s'obren sols),
   segueix cada grup, marca les ajudes, imprimeix les targetes i exporta els resultats.
   Els punts es recalculen sempre amb l'avaluador a partir dels bitllets i les respostes desats. */
import { STORAGE_KEYS, NOMS_GRUPS, LIMITS, VERSIO_APP, URL_APP, DEMO } from './config.js';
import { obreMagatzem } from './magatzem.js';
import { creaAvaluador } from './avaluador.js';
import { creaAgencia, descodifica } from './agencia.js';
import { TEXTOS } from './textos.js';
import { iniciaEscala } from './escala.js';
import { h, icona, horaDia, euros, punts, avis } from './ui.js';

const S = {
  D: null, A: null, M: null, AG: null,
  tandaId: null, tanda: null, grups: [], progres: {}, membres: {}, valoracio: {}, pins: {},
  detall: null, desubs: [], desubsGrups: []
};
const $main = () => document.getElementById('main');
const nomEst = (s) => S.D.estacions[s]?.nom ?? s;

async function inicia() {
  iniciaEscala();
  S.D = await (await fetch('dades/dades.json', { cache: 'no-cache' })).json();
  S.A = creaAvaluador(S.D);
  S.M = await obreMagatzem();
  S.AG = creaAgencia(S.M, S.D, S.A);
  const desada = localStorage.getItem(STORAGE_KEYS.DOCENT);
  if (desada && await potDirigir(desada)) obreTanda(desada);
  else pantallaTandes();
}

/** aquest aparell pot dirigir la tanda (l'ha creada o hi ha entrat amb la contrasenya) */
async function potDirigir(tandaId) {
  const t = await S.M.get(`tandes/${tandaId}`).catch(() => null);
  if (!t) return false;
  if (t.propietariUid === S.M.uid()) return true;
  return !!(await S.M.get(`tandes/${tandaId}/docents/${S.M.uid()}`).catch(() => null));
}

/* tandes recordades en aquest aparell (les creades aquí i les obertes amb contrasenya) */
const recordades = () => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.DOCENT_TANDES) || '[]'); } catch (_) { return []; } };
const recorda = (id) => localStorage.setItem(STORAGE_KEYS.DOCENT_TANDES, JSON.stringify([id, ...recordades().filter((x) => x !== id)].slice(0, 20)));

/* ---------------------------------------------------------------- dates del calendari */
const dos = (n) => String(n).padStart(2, '0');
const aInput = (ms) => { const d = new Date(ms); return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`; };
const deInput = (v) => { const [y, m, d] = String(v).split('-').map(Number); return y ? new Date(y, m - 1, d).getTime() : null; };
const DIES = ['dg.', 'dl.', 'dt.', 'dc.', 'dj.', 'dv.', 'ds.'];
const dataCurta = (ms) => { const d = new Date(ms); return `${DIES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`; };
const avui = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };
const DIA = 86400000;

/** què s'obre a cada trobada, segons reptes.json */
function obreATrobada(n) {
  const bl = S.D.reptes.blocs.filter((b) => b.trobada === n);
  const parts = bl.map((b) => (b.bloc === 4 ? 'via tallada' : `bloc ${b.bloc}`));
  return parts.length ? `S'obre: ${parts.join(' i ')}` : 'Continuen el bloc 3';
}

function campsCalendari(valors) {
  return h('div', { class: 'calendari' }, [1, 2, 3, 4].map((n) => h('label', { class: 'dia-trobada' },
    h('span', { class: 'dia-trobada-n' }, `Trobada ${n}`),
    h('input', { type: 'date', value: aInput(valors[n - 1]), 'data-n': n, 'aria-label': `Data de la trobada ${n}` }),
    h('span', { class: 'dia-trobada-obre' }, obreATrobada(n)))));
}

function llegeixCalendari(caixa) {
  const v = [...caixa.querySelectorAll('input[type=date]')].map((x) => deInput(x.value));
  if (v.some((x) => !x)) return { error: 'Poseu la data de les quatre trobades.' };
  if (v.some((x, i) => i && x < v[i - 1])) return { error: 'Les trobades han d\'anar per ordre de data.' };
  return { calendari: v };
}

function campClau(id, autocomplete) {
  const input = h('input', { id, type: 'password', autocomplete, maxlength: 60 });
  const boto = h('button', { type: 'button', class: 'boto-icona veure', 'aria-label': 'Mostra la contrasenya',
    onclick: () => { input.type = input.type === 'password' ? 'text' : 'password'; } }, icona('ull'));
  return { input, caixa: h('div', { class: 'camp-clau' }, input, boto) };
}

/* ================================================================ entrada del professorat */
async function pantallaTandes() {
  for (const d of [...S.desubs, ...S.desubsGrups]) d();
  S.desubs = []; S.desubsGrups = []; S.tandaId = null; S.tanda = null;
  localStorage.removeItem(STORAGE_KEYS.DOCENT);
  document.getElementById('capcalera-dreta').replaceChildren(
    h('a', { class: 'boto petit', href: 'manual.html', target: '_blank' }, icona('ajuda'), 'Manual'),
    h('a', { class: 'boto petit', href: DEMO ? './?demo' : './' }, icona('tren'), 'Alumnat'));

  // tandes d'aquest aparell
  const ids = new Set(recordades());
  for (const t of await S.M.list('tandes', ['propietariUid', S.M.uid()]).catch(() => [])) ids.add(t.id);
  const tandes = [];
  for (const id of ids) {
    if (!(await potDirigir(id))) continue;
    const t = await S.M.get(`tandes/${id}`).catch(() => null);
    if (t && t.expiraMs > Date.now()) tandes.push({ id, ...t });
  }
  tandes.sort((a, b) => b.creadaMs - a.creadaMs);

  // entra amb codi i contrasenya
  const codi = h('input', { id: 'codi-docent', class: 'camp-codi petit', maxlength: 4, autocomplete: 'off', spellcheck: 'false', placeholder: 'K7Q2' });
  const clauE = campClau('clau-entra', 'current-password');
  const errE = h('p', { class: 'missatge-error', role: 'alert' });
  const entra = async () => {
    errE.textContent = '';
    try {
      const id = await S.AG.entraDocent(codi.value.trim().toUpperCase(), clauE.input.value);
      recorda(id); obreTanda(id);
    } catch (e) {
      errE.textContent = e.message === 'CODI' ? 'Aquest codi no existeix o ja ha caducat.'
        : e.message === 'CLAU' ? 'La contrasenya no és correcta.' : 'No hi ha connexió. Torneu-ho a provar.';
    }
  };
  clauE.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') entra(); });

  // tanda nova
  const nGrups = h('select', { id: 'ngrups' }, Array.from({ length: LIMITS.MAX_GRUPS }, (_, i) => i + 1)
    .map((n) => h('option', { value: n, selected: n === 6 }, n)));
  const nom = h('input', { id: 'nom-tanda', maxlength: LIMITS.MAX_NOM_TANDA, value: `Tanda ${tandes.length + 1}` });
  const noms = h('div', { class: 'noms-grups' });
  const pintaNoms = () => noms.replaceChildren(...Array.from({ length: Number(nGrups.value) }, (_, i) =>
    h('input', { class: 'nom-grup', maxlength: 24, value: NOMS_GRUPS[i] || `Grup ${i + 1}`, 'aria-label': `Nom del grup ${i + 1}` })));
  nGrups.addEventListener('change', pintaNoms);
  pintaNoms();
  const a = avui();
  const cal = campsCalendari([a, a + DIA, a + 7 * DIA, a + 8 * DIA]);
  const clauN = campClau('clau-nova', 'new-password');
  const errN = h('p', { class: 'missatge-error', role: 'alert' });
  const crea = async () => {
    errN.textContent = '';
    const llista = [...noms.querySelectorAll('input')].map((x) => x.value.trim()).filter(Boolean);
    const c = llegeixCalendari(cal);
    if (!nom.value.trim() || !llista.length) { errN.textContent = 'Poseu el nom de la tanda i dels grups.'; return; }
    if (c.error) { errN.textContent = c.error; return; }
    if (clauN.input.value.length < 6) { errN.textContent = 'La contrasenya ha de tenir 6 caràcters com a mínim.'; return; }
    try {
      const { tandaId } = await S.AG.creaTanda({ nom: nom.value.trim(), noms: llista, calendari: c.calendari, clau: clauN.input.value });
      recorda(tandaId); obreTanda(tandaId);
    } catch (_) { errN.textContent = 'No s\'ha pogut crear la tanda. Comproveu la connexió.'; }
  };

  $main().replaceChildren(h('div', { class: 'docent-tandes' },
    h('div', { class: 'docent-columna' },
      h('section', { class: 'targeta' },
        h('h2', {}, icona('persona'), 'Professorat'),
        h('p', { class: 'nota' }, 'Entreu a la vostra tanda des de qualsevol aparell.'),
        h('label', { class: 'etiqueta', for: 'codi-docent' }, 'Codi de la tanda'), codi,
        h('label', { class: 'etiqueta', for: 'clau-entra' }, 'Contrasenya del professorat'), clauE.caixa,
        errE,
        h('button', { class: 'boto primari', onclick: entra }, 'Entra', icona('fletxa'))),
      tandes.length ? h('section', { class: 'targeta' },
        h('h2', {}, icona('calendari'), 'En aquest aparell'),
        h('ul', { class: 'llista-tandes' }, tandes.map((t) => h('li', {},
          h('button', { class: 'boto-tanda', onclick: () => obreTanda(t.id) },
            h('strong', {}, t.nom), h('span', {}, `Codi ${t.codi} · ${t.grups.length} grups${t.estat === 'tancada' ? ' · tancada' : ''}`)))))) : null),
    h('section', { class: 'targeta' },
      h('h2', {}, icona('estrella'), 'Tanda nova'),
      h('label', { class: 'etiqueta', for: 'nom-tanda' }, 'Nom (per exemple, el grup classe)'), nom,
      h('label', { class: 'etiqueta', for: 'ngrups' }, 'Nombre de grups'), nGrups,
      h('p', { class: 'etiqueta' }, 'Noms dels grups'), noms,
      h('p', { class: 'etiqueta' }, 'Dates de les quatre trobades'), cal,
      h('p', { class: 'nota' }, 'Els blocs s\'obren sols el dia de cada trobada. Durant la sessió no cal tocar res.'),
      h('label', { class: 'etiqueta', for: 'clau-nova' }, 'Contrasenya del professorat (apunteu-la)'), clauN.caixa,
      errN,
      h('button', { class: 'boto primari', onclick: crea }, 'Crea la tanda', icona('fletxa')),
      S.M.mode === 'local' ? h('p', { class: 'nota' }, 'Mode local: la tanda només existeix en aquest navegador.') : null)));
  setTimeout(() => codi.focus(), 50);
}

/* ================================================================ una tanda */
function obreTanda(tandaId) {
  for (const d of [...S.desubs, ...S.desubsGrups]) d();
  S.desubs = []; S.desubsGrups = [];
  S.tandaId = tandaId; S.progres = {}; S.membres = {}; S.valoracio = {}; S.detall = null;
  localStorage.setItem(STORAGE_KEYS.DOCENT, tandaId);
  recorda(tandaId);
  const base = `tandes/${tandaId}`;
  S.desubs.push(S.M.watch(base, (t) => { S.tanda = t; pinta(); }));
  const rellotge = setInterval(pinta, 60000);
  S.desubs.push(() => clearInterval(rellotge));
  S.desubs.push(S.M.watch(`${base}/grups`, (gs) => {
    S.grups = gs.sort((a, b) => a.ordre - b.ordre);
    for (const d of S.desubsGrups) d();
    S.desubsGrups = [];
    for (const g of S.grups) {
      S.desubsGrups.push(S.M.watch(`${base}/grups/${g.id}/reptes`, (docs) => { S.progres[g.id] = Object.fromEntries(docs.map((d) => [d.id, d])); pinta(); }));
      S.desubsGrups.push(S.M.watch(`${base}/grups/${g.id}/membres`, (ms) => { S.membres[g.id] = ms; pinta(); }));
      S.desubsGrups.push(S.M.watch(`${base}/valoracio/${g.id}`, (v) => { S.valoracio[g.id] = v || { ajuda: [], notes: '' }; pinta(); }));
    }
    pinta();
  }));
  S.M.list(`${base}/claus`).then((cs) => { S.pins = Object.fromEntries(cs.map((c) => [c.id, c.pin])); }).catch(() => {});
}

let pintant = false;
function pinta() {
  if (!S.tanda || pintant) return;
  // si el docent està canviant una data, s'espera que acabi per no perdre el que escriu
  if (document.activeElement?.closest?.('.barra-tanda')) { setTimeout(pinta, 1500); return; }
  pintant = true;
  requestAnimationFrame(() => { pintant = false; pintaTanda(); });
}

const ajudesDe = (gid) => S.valoracio[gid]?.ajuda || [];

function actualitza(camps) {
  return S.M.update(`tandes/${S.tandaId}`, camps).catch(() => avis('No s\'ha pogut desar el canvi.', 'error'));
}

/** frase d'estat del dia: què veuen avui els grups */
function estatAvui(t) {
  const n = S.AG.trobadaActual(t);
  const b = S.AG.blocActual(t);
  const via = S.AG.viaTalladaActiva(t);
  const oberts = `${b === 1 ? 'bloc 1 obert' : `blocs 1 a ${b} oberts`}${via ? ' i via tallada activa' : ''}`;
  if (!t.calendari) return `Ara: ${oberts}.`;
  const proper = [1, 2, 3, 4].find((k) => t.calendari[k - 1] > Date.now());
  const ara = n ? `Trobada ${n}` : 'Encara no ha començat';
  return `${ara}: ${oberts}.${proper ? ` Trobada ${proper}: ${dataCurta(t.calendari[proper - 1])}.` : ''}`;
}

function pintaTanda() {
  const t = S.tanda;
  document.getElementById('capcalera-dreta').replaceChildren(
    h('button', { class: 'boto petit', onclick: imprimeixTargetes }, icona('impressora'), 'Targetes d\'accés'),
    h('button', { class: 'boto petit', onclick: exportaCSV }, icona('baixa'), 'Exporta CSV'),
    h('a', { class: 'boto petit', href: 'manual.html', target: '_blank' }, icona('ajuda'), 'Manual'),
    DEMO ? h('a', { class: 'boto petit', href: './?demo' }, icona('tren'), 'Vista de l\'alumnat')
      : h('button', { class: 'boto petit', onclick: pantallaTandes }, 'Tandes'));
  const bActual = S.AG.blocActual(t);
  const viaActiva = S.AG.viaTalladaActiva(t);
  const cal = t.calendari ? campsCalendari(t.calendari) : null;
  cal?.addEventListener('change', () => {
    const c = llegeixCalendari(cal);
    if (c.error) return avis(c.error, 'error');
    actualitza({ calendari: c.calendari });
  });
  // obrir abans d'hora: només per a imprevistos (no cal durant les sessions)
  const blocs = h('div', { class: 'segmentat', role: 'group', 'aria-label': 'Blocs oberts' },
    S.D.reptes.blocs.map((b) => h('button', {
      class: b.bloc <= bActual ? 'actiu' : '', title: `${b.titol} (${b.reptes.join(', ')})`,
      onclick: () => actualitza({ blocObert: Math.max(b.bloc, t.blocObert), estat: 'en_curs' })
    }, `${b.bloc} · ${b.titol}`)));
  const abans = h('details', { class: 'abans-hora' },
    h('summary', {}, 'Obrir abans d\'hora'),
    h('div', { class: 'abans-cos' },
      h('p', { class: 'nota' }, 'Només per a imprevistos: els blocs s\'obren sols el dia de cada trobada.'),
      blocs,
      h('label', { class: `interruptor ${viaActiva ? 'on' : ''}` },
        h('input', { type: 'checkbox', checked: viaActiva, disabled: viaActiva && !t.avisViaTallada,
          onchange: (e) => actualitza({ avisViaTallada: e.target.checked }) }),
        icona('avis'), 'Via tallada ara')));
  const barra = h('section', { class: 'barra-tanda targeta' },
    h('div', { class: 'tanda-id' }, h('h1', {}, t.nom),
      h('p', {}, 'Codi ', h('strong', { class: 'codi-gran' }, t.codi))),
    h('div', { class: 'tanda-estat' },
      h('p', { class: 'estat-avui' }, icona('calendari'), estatAvui(t)),
      cal),
    h('div', { class: 'tanda-accions' }, abans,
      t.estat === 'tancada'
        ? h('button', { class: 'boto petit', onclick: () => actualitza({ estat: 'en_curs' }) }, 'Reobre la tanda')
        : h('button', { class: 'boto petit perill', onclick: () => actualitza({ estat: 'tancada' }) }, 'Tanca la tanda')));
  const cos = h('div', { class: 'docent-cos' }, graellaGrups(), S.detall ? detallGrup(S.detall) : null);
  $main().replaceChildren(h('div', { class: 'docent-tanda' }, barra, cos,
    h('p', { class: 'versio' }, `Dades: ${S.D.versio} · App ${VERSIO_APP}`)));
}

function graellaGrups() {
  const reptes = S.D.reptes.reptes;
  const taula = h('table', { class: 'graella-grups-docent' },
    h('thead', {}, h('tr', {}, h('th', {}, 'Grup'), reptes.map((r) => h('th', { title: r.titol, class: 'b', style: `--c: var(--b${S.AG.BLOC[r.codi]})` }, r.codi)),
      h('th', {}, 'Punts'), h('th', {}, 'Nota'), h('th', {}, 'Aparells'))));
  const tbody = h('tbody');
  for (const g of S.grups) {
    const prog = S.progres[g.id] || {};
    const { total, perRepte, coherent, nota } = S.AG.puntsGrup(prog, ajudesDe(g.id));
    const estats = S.AG.estatReptes(S.tanda, prog);
    const actiu = Date.now() - (g.darreraActivitatMs || 0) < 3 * 60000;
    tbody.append(h('tr', { class: S.detall === g.id ? 'seleccionat' : '' },
      h('th', {}, h('button', { class: 'boto-grup-docent', onclick: () => { S.detall = S.detall === g.id ? null : g.id; pinta(); } },
        h('span', { class: `punt-actiu ${actiu ? 'on' : ''}`, title: actiu ? 'Treballant ara' : 'Sense activitat recent' }), g.nom)),
      reptes.map((r) => {
        const p = perRepte[r.codi];
        const est = estats[r.codi];
        const ajut = ajudesDe(g.id).some((a) => a.startsWith(r.codi + '.'));
        return h('td', { class: `cel ${est} ${g.repteActual === r.codi && est === 'obert' ? 'ara' : ''}`, title: `${r.titol}: ${p.punts} punts` },
          h('span', { class: 'punts-nivell' }, [1, 2, 3].map((n) => h('i', { class: n <= p.nivell ? 'ple' : '' }))),
          est === 'lliurat' ? icona('check', 'mini') : null, ajut ? h('span', { class: 'marca-ajuda', title: 'Amb ajuda' }, 'A') : null);
      }),
      h('td', { class: 'num' }, punts(total), coherent ? null : h('span', { class: 'alerta', title: 'Els punts desats pel grup no coincideixen amb el recàlcul' }, icona('avis', 'mini'))),
      h('td', { class: 'num' }, nota.toLocaleString('ca-ES', { minimumFractionDigits: 1 })),
      h('td', { class: 'num' }, (S.membres[g.id] || []).length)));
  }
  taula.append(tbody);
  return h('section', { class: 'targeta graella-docent' }, taula,
    h('p', { class: 'llegenda' }, 'Cercles: nivells assolits (Regional, Exprés, Alta velocitat). A: nivell fet amb ajuda (val la meitat). Nota = punts / 1000.'));
}

/* ---------------------------------------------------------------- detall d'un grup */
function detallGrup(gid) {
  const g = S.grups.find((x) => x.id === gid);
  if (!g) return null;
  const prog = S.progres[gid] || {};
  const ajudes = ajudesDe(gid);
  const caixa = h('section', { class: 'targeta detall' },
    h('div', { class: 'detall-cap' }, h('h2', {}, `Grup ${g.nom}`),
      h('span', { class: 'pin' }, 'PIN ', h('strong', {}, S.pins[gid] || '····')),
      h('button', { class: 'boto-icona', 'aria-label': 'Tanca', onclick: () => { S.detall = null; pinta(); } }, icona('creu'))));
  for (const r of S.D.reptes.reptes) {
    const doc = prog[r.codi];
    if (!doc) continue;
    const p = S.AG.puntsRepte(r.codi, prog, ajudes);
    const bloc = h('div', { class: 'detall-repte' },
      h('h3', {}, `${r.codi} · ${r.titol}`, h('span', { class: 'detall-punts' }, `${punts(p.punts)} punts`),
        doc.estat === 'lliurat' ? h('button', { class: 'boto petit', onclick: () => reobre(gid, r.codi) }, 'Reobre') : null));
    const files = h('div', { class: 'detall-nivells' });
    for (const n of r.nivells) {
      const clau = `${r.codi}.${n.nivell}`;
      const fet = n.nivell <= p.nivell;
      files.append(h('label', { class: `detall-nivell ${fet ? 'fet' : ''}` },
        h('input', { type: 'checkbox', checked: ajudes.includes(clau), disabled: !fet, onchange: (e) => marcaAjuda(gid, clau, e.target.checked) }),
        `${TEXTOS.nivells[n.nivell - 1]} · amb ajuda`));
    }
    bloc.append(files);
    const viatges = r.modalitat === 'escala'
      ? r.nivells.map((n) => doc.nivells?.[n.nivell]).filter(Boolean)
      : (doc.millor ? [doc.millor] : []);
    for (const v of viatges) bloc.append(resumViatge(descodifica(v.bitllets), v.intents));
    if (!viatges.length && doc.esborrany?.bitllets?.length) bloc.append(h('p', { class: 'nota' }, 'En curs:'), resumViatge(descodifica(doc.esborrany.bitllets), doc.esborrany.intents));
    if (r.codi === 'R9' && doc.tall) {
      bloc.append(h('p', { class: 'nota' }, `Tall: ${nomEst(doc.tall.tram[0])} – ${nomEst(doc.tall.tram[1])}, dia ${doc.tall.dia}. Reparació mínima: ${doc.tall.minim} €. Origen: ${doc.tall.origen}.`));
    }
    caixa.append(bloc);
  }
  const ms = S.membres[gid] || [];
  caixa.append(h('div', { class: 'detall-aparells' },
    h('p', {}, `${ms.length} ${ms.length === 1 ? 'aparell connectat' : 'aparells connectats'}`),
    ms.length ? h('button', { class: 'boto petit', onclick: () => treuAparells(gid) }, 'Treu els aparells') : null));
  return caixa;
}

function resumViatge(bitllets, intents) {
  return h('ol', { class: 'resum-viatge' }, bitllets.map(([dia, tren, de, a]) => {
    const t = S.D.trens[tren];
    const st = t.parades.map((p) => p[0]);
    const i = st.indexOf(de), j = st.indexOf(a);
    let preu = 0;
    for (let x = i; x < j; x++) preu += t.tarifes[x];
    return h('li', {}, `D${dia} ${nomEst(de)} ${horaDia(t.parades[i][1])} → ${nomEst(a)} ${horaDia(t.parades[j][1])} · ${euros(preu)}`);
  }), intents ? h('li', { class: 'intents' }, `${intents} ${intents === 1 ? 'intent' : 'intents'}`) : null);
}

async function marcaAjuda(gid, clau, on) {
  const v = S.valoracio[gid] || { ajuda: [], notes: '' };
  const ajuda = on ? [...new Set([...(v.ajuda || []), clau])] : (v.ajuda || []).filter((x) => x !== clau);
  await S.M.set(`tandes/${S.tandaId}/valoracio/${gid}`, { ...v, ajuda });
}

async function reobre(gid, codi) {
  await S.M.update(`tandes/${S.tandaId}/grups/${gid}/reptes/${codi}`, { estat: 'obert' });
  avis(`${codi} reobert per al grup.`, 'ok');
}

async function treuAparells(gid) {
  for (const m of S.membres[gid] || []) await S.M.remove(`tandes/${S.tandaId}/grups/${gid}/membres/${m.id}`);
  avis('Aparells desconnectats. El grup haurà d\'entrar de nou amb el PIN.', 'ok');
}

/* ---------------------------------------------------------------- targetes i exportació */
async function imprimeixTargetes() {
  const cs = await S.M.list(`tandes/${S.tandaId}/claus`);
  S.pins = Object.fromEntries(cs.map((c) => [c.id, c.pin]));
  const url = URL_APP;
  const caixa = document.getElementById('targetes');
  caixa.replaceChildren(...S.grups.map((g) => h('div', { class: 'targeta-acces' },
    h('div', { class: 'targeta-cap' }, h('img', { src: 'favicon.svg', alt: '' }), h('strong', {}, 'Pròxima sortida')),
    h('p', { class: 'targeta-grup' }, `Grup ${g.nom}`),
    h('dl', {}, h('dt', {}, 'Adreça'), h('dd', {}, url),
      h('dt', {}, 'Codi de la tanda'), h('dd', { class: 'gran' }, S.tanda.codi),
      h('dt', {}, 'PIN del grup'), h('dd', { class: 'gran' }, S.pins[g.id] || '')),
    h('p', { class: 'targeta-peu' }, 'Guardeu aquesta targeta: la necessitareu a cada trobada.'))));
  window.print();
}

function exportaCSV() {
  const reptes = S.D.reptes.reptes;
  const cap = ['Grup', ...reptes.map((r) => `${r.codi} nivell`), ...reptes.map((r) => `${r.codi} punts`), 'Ajudes', 'Punts', 'Nota de grup'];
  const files = [cap];
  for (const g of S.grups) {
    const prog = S.progres[g.id] || {};
    const { total, perRepte, nota } = S.AG.puntsGrup(prog, ajudesDe(g.id));
    files.push([g.nom, ...reptes.map((r) => perRepte[r.codi].nivell), ...reptes.map((r) => perRepte[r.codi].punts),
      ajudesDe(g.id).join(' '), total, nota.toLocaleString('ca-ES', { minimumFractionDigits: 1 })]);
  }
  const csv = '﻿' + files.map((f) => f.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(';')).join('\r\n');
  const a = h('a', { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })), download: `proxima-sortida-${S.tanda.codi}.csv` });
  document.body.append(a);
  a.click();
  a.remove();
}

inicia();
