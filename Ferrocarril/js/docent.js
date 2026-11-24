/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Panell del professorat. La primera vegada en cada aparell demana la contrasenya del panell (js/solucionari.js);
   després s'entra a cada tanda amb el seu codi i la contrasenya de la tanda.
   Crea la tanda amb el calendari de les quatre trobades (els blocs i la via tallada s'obren sols),
   segueix cada grup, marca les ajudes, imprimeix les targetes i exporta els resultats.
   Els punts es recalculen sempre amb l'avaluador a partir dels bitllets i les respostes desats. */
import { STORAGE_KEYS, NOMS_GRUPS, NOMS_TANDES, LIMITS, VERSIO_APP, URL_APP, DEMO } from './config.js';
import { obreImprimibles } from './imprimibles.js';
import { solucionariDesat, porta, obreSolucionari, oblidaAparell, canviaContrasenya } from './solucionari.js';
import { obreMagatzem } from './magatzem.js';
import { creaAvaluador } from './avaluador.js';
import { creaAgencia, descodifica } from './agencia.js';
import { TEXTOS, textError } from './textos.js';
import { iniciaEscala } from './escala.js';
import { h, icona, horaDia, horaText, euros, punts, avis } from './ui.js';

const S = {
  D: null, A: null, M: null, AG: null, SOL: null,
  tandaId: null, tanda: null, grups: [], progres: {}, membres: {}, valoracio: {}, pins: {}, intents: {},
  detall: null, desubs: [], desubsGrups: []
};
const $main = () => document.getElementById('main');
const nomEst = (s) => S.D.estacions[s]?.nom ?? s;

async function inicia() {
  iniciaEscala();
  // porta del panell: la primera vegada en aquest aparell es demana la contrasenya del panell
  S.SOL = await solucionariDesat().catch(() => null);
  if (!S.SOL) S.SOL = await porta($main());
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

function campsCalendari(valors, marcaAvui = false) {
  return h('div', { class: 'calendari' }, [1, 2, 3, 4].map((n) => h('label', { class: `dia-trobada ${marcaAvui && valors[n - 1] === avui() ? 'avui' : ''}` },
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
    botoSolucionari(), ...botonsDocuments(),
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
  const usats = new Set(tandes.map((t) => t.nom));
  const nom = h('input', { id: 'nom-tanda', maxlength: LIMITS.MAX_NOM_TANDA, list: 'noms-tandes',
    value: NOMS_TANDES.find((n) => !usats.has(n)) || `Tanda ${tandes.length + 1}` });
  const suggeriments = h('datalist', { id: 'noms-tandes' }, NOMS_TANDES.map((n) => h('option', { value: n })));
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
        h('label', { class: 'etiqueta', for: 'clau-entra' }, 'Contrasenya de la tanda'), clauE.caixa,
        errE,
        h('button', { class: 'boto primari', onclick: entra }, 'Entra', icona('fletxa'))),
      tandes.length ? h('section', { class: 'targeta' },
        h('h2', {}, icona('calendari'), 'En aquest aparell'),
        h('ul', { class: 'llista-tandes' }, tandes.map((t) => h('li', {},
          h('button', { class: 'boto-tanda', onclick: () => obreTanda(t.id) },
            h('strong', {}, t.nom), h('span', {}, `Codi ${t.codi} · ${t.grups.length} grups${t.estat === 'tancada' ? ' · tancada' : ''}`)))))) : null,
      h('div', { class: 'accions-aparell' },
        h('button', { class: 'boto-text tanca-aparell', onclick: () => { oblidaAparell(); location.reload(); } },
          icona('cadenat', 'mini'), 'Tanca el panell en aquest aparell'),
        h('button', { class: 'boto-text', onclick: canviaContrasenya }, icona('persona', 'mini'), 'Canvia la contrasenya del panell'))),
    h('section', { class: 'targeta' },
      h('h2', {}, icona('estrella'), 'Tanda nova'),
      h('label', { class: 'etiqueta', for: 'nom-tanda' }, 'Grup classe (Alfa, Beta, Gamma, Delta o Èpsilon)'), nom, suggeriments,
      h('label', { class: 'etiqueta', for: 'ngrups' }, 'Nombre de grups'), nGrups,
      h('p', { class: 'etiqueta' }, 'Noms dels grups'), noms,
      h('p', { class: 'etiqueta' }, 'Dates de les quatre trobades'), cal,
      h('p', { class: 'nota' }, 'Els blocs s\'obren sols el dia de cada trobada. Durant la sessió no cal tocar res.'),
      h('label', { class: 'etiqueta', for: 'clau-nova' }, 'Contrasenya de la tanda (apunteu-la)'), clauN.caixa,
      errN,
      h('button', { class: 'boto primari', onclick: crea }, 'Crea la tanda', icona('fletxa')),
      S.M.mode === 'local' ? h('p', { class: 'nota' }, 'Mode local: la tanda només existeix en aquest navegador.') : null)));
  setTimeout(() => codi.focus(), 50);
}

/* ================================================================ solucionari i documents */
function botoSolucionari() {
  return h('button', { class: 'boto petit primari', onclick: () => obreSolucionari({
    SOL: S.SOL, D: S.D, A: S.A, AG: S.AG, nomEst, grups: S.tanda ? S.grups : [], progres: S.progres
  }) }, icona('check'), 'Solucionari');
}

const botonsDocuments = () => [
  h('button', { class: 'boto petit', onclick: () => obreImprimibles({ SOL: S.SOL, targetes: S.tanda ? imprimeixTargetes : null }),
    title: 'Tots els materials en paper i la presentació' }, icona('impressora'), 'Imprimibles'),
  h('a', { class: 'boto petit', href: 'manual.html', target: '_blank' }, icona('ajuda'), 'Manual')];

/* ================================================================ una tanda */
function obreTanda(tandaId) {
  for (const d of [...S.desubs, ...S.desubsGrups]) d();
  S.desubs = []; S.desubsGrups = [];
  S.tandaId = tandaId; S.progres = {}; S.membres = {}; S.valoracio = {}; S.intents = {}; S.detall = null;
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
      S.desubsGrups.push(S.M.watch(`${base}/grups/${g.id}/intents`, (xs) => { S.intents[g.id] = xs.sort((a, b) => a.ms - b.ms); pinta(); }));
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
    botoSolucionari(),
    h('button', { class: 'boto petit', onclick: imprimeixTargetes }, icona('impressora'), 'Targetes d\'accés'),
    h('button', { class: 'boto petit', onclick: exportaCSV }, icona('baixa'), 'Exporta CSV'),
    ...botonsDocuments(),
    DEMO ? h('a', { class: 'boto petit', href: './?demo' }, icona('tren'), 'Vista de l\'alumnat')
      : h('button', { class: 'boto petit', onclick: pantallaTandes }, 'Tandes'));
  const bActual = S.AG.blocActual(t);
  const viaActiva = S.AG.viaTalladaActiva(t);
  const cal = t.calendari ? campsCalendari(t.calendari, true) : null;
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
    h('thead', {}, h('tr', {}, h('th', {}, 'Grup'), reptes.map((r) => h('th', { title: r.titol, class: 'b', style: `--c: var(--b${S.AG.BLOC[r.codi]})` }, r.codi, h('span', { 'aria-hidden': 'true' }))),
      h('th', {}, 'Punts'), h('th', {}, 'Nota'), h('th', {}, 'Aparells'))));
  const tbody = h('tbody');
  for (const g of S.grups) {
    const prog = S.progres[g.id] || {};
    const { total, perRepte, coherent, nota } = S.AG.puntsGrup(prog, ajudesDe(g.id));
    const estats = S.AG.estatReptes(S.tanda, prog);
    const actiu = Date.now() - (g.darreraActivitatMs || 0) < 3 * 60000;
    const { motiu } = seguimentGrup(g);
    tbody.append(h('tr', { class: `${S.detall === g.id ? 'seleccionat' : ''} ${motiu ? 'encallat' : ''}` },
      h('th', {}, h('button', { class: 'boto-grup-docent', onclick: () => { S.detall = S.detall === g.id ? null : g.id; pinta(); } },
        h('span', { class: `punt-actiu ${actiu ? 'on' : ''}`, title: actiu ? 'Treballant ara' : 'Sense activitat recent' }), g.nom),
        motiu ? h('span', { class: 'marca-encallat', title: motiu }, icona('avis', 'mini'), 'Encallat') : null),
      reptes.map((r) => {
        const p = perRepte[r.codi];
        const est = estats[r.codi];
        const ajut = ajudesDe(g.id).some((a) => a.startsWith(r.codi + '.'));
        return h('td', { class: `cel ${est} ${g.repteActual === r.codi && est === 'obert' ? 'ara' : ''}`, style: `--c: var(--b${S.AG.BLOC[r.codi]})`, title: `${r.titol}: ${p.punts} punts` },
          h('span', { class: 'punts-nivell' }, [1, 2, 3].map((n) => h('i', { class: n <= p.nivell ? 'ple' : '' }))),
          est === 'lliurat' ? icona('check', 'mini') : null, ajut ? h('span', { class: 'marca-ajuda', title: 'Amb ajuda' }, 'A') : null);
      }),
      h('td', { class: 'num' }, punts(total), coherent ? null : h('span', { class: 'alerta', title: 'Els punts desats pel grup no coincideixen amb el recàlcul' }, icona('avis', 'mini'))),
      h('td', { class: 'num' }, nota.toLocaleString('ca-ES', { minimumFractionDigits: 1 })),
      h('td', { class: 'num' }, (S.membres[g.id] || []).length)));
  }
  taula.append(tbody);
  return h('section', { class: 'targeta graella-docent' }, franjaErrors(), taula,
    h('p', { class: 'llegenda' },
      h('span', {}, h('span', { class: 'punts-nivell' }, h('i', { class: 'ple' }), h('i', { class: 'ple' }), h('i')), 'Nivells: Regional, Exprés, Alta velocitat'),
      h('span', {}, icona('check', 'mini'), 'Lliurat'),
      h('span', {}, h('span', { class: 'marca-ajuda' }, 'A'), 'Amb ajuda (val la meitat)'),
      h('span', {}, h('span', { class: 'punt-actiu on' }), 'Treballant ara'),
      h('span', {}, h('span', { class: 'marca-encallat' }, icona('avis', 'mini'), 'Encallat'), `${ENCALLAT.INTENTS} intents seguits amb errors o ${ENCALLAT.MINUTS} min sense cap nivell`),
      h('span', {}, 'Nota = punts / 1000')));
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
      h('button', { class: 'boto-icona', 'aria-label': 'Tanca', onclick: () => { S.detall = null; pinta(); } }, icona('creu'))),
    detallAra(g));
  for (const r of S.D.reptes.reptes) {
    const doc = prog[r.codi];
    if (!doc) continue;
    const p = S.AG.puntsRepte(r.codi, prog, ajudes);
    const bloc = h('div', { class: 'detall-repte' },
      h('h3', { style: `--c: var(--b${S.AG.BLOC[r.codi]})` }, h('span', { class: 'codi-repte' }, r.codi), r.titol, h('span', { class: 'detall-punts' }, `${punts(p.punts)} punts`),
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
    if (!viatges.length && doc.esborrany?.bitllets?.length && r.codi !== g.repteActual) bloc.append(h('p', { class: 'nota' }, 'En curs:'), resumViatge(descodifica(doc.esborrany.bitllets), doc.esborrany.intents));
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

/* ================================================================ seguiment: errors i grups encallats */
// Cada comprovació de l'alumnat queda desada a grups/{g}/intents amb els errors (codis de l'avaluador)
// i les respostes incorrectes («resposta:valor»). El panell en treu tres coses:
//  · grup encallat: 3 intents seguits amb errors, o 12 minuts treballant sense aconseguir cap nivell;
//  · darrers errors de cada grup, en paraules planeres;
//  · errors de la classe: el mateix tipus d'error a dos grups o més en els darrers 30 minuts.
const ENCALLAT = { INTENTS: 3, MINUTS: 12, RECENT_MIN: 15 };
const FINESTRA_CLASSE_MIN = 30;
const CATEGORIA = {
  canvi: 'Canvi de menys de 10 minuts', visita: 'Visita de menys de 2 hores', min_visites: 'Falten ciutats visitades',
  continuitat: 'Bitllets que no enllacen', mateix_tren: 'Dos bitllets del mateix tren', tren: 'Bitllet mal comprat', parada: 'Bitllet mal comprat',
  termini: 'Tornada massa tard', arribada_dia: 'Tornada un altre dia', torna_abans: 'Tornen a Barcelona abans d\'hora',
  pressupost: 'Viatge massa car', pressupost_reparacio: 'Reparació massa cara', tallat: 'Tren pel tram tallat',
  primer_fix: 'Canvien el primer bitllet', max_bitllets: 'Massa canvis de tren', min_bitllets: 'Cal canviar de tren',
  origen: 'No és el viatge que demana el client', desti: 'No és el viatge que demana el client', primer_dia: 'No és el viatge que demana el client',
  primer_surt: 'No és el viatge que demana el client', primer_fins: 'No és el viatge que demana el client',
  primer_cap_a: 'No és el viatge que demana el client', objectiu: 'Correcte, però no és el que demana el client',
  alguna_de: 'Correcte, però no és el que demana el client'
};
const PREGUNTA = {
  sortida: 'hora de sortida', arribada: 'hora d\'arribada', total: 'preu', estada: 'temps en una ciutat', estades: 'temps en una ciutat',
  espera: 'temps d\'espera', saldo: 'saldo', diferencia_euros: 'diferència de preu', diferencia_hora: 'diferència d\'hora', percentatge: 'percentatge'
};
const iniciAvui = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const minutsDes = (ms) => Math.max(0, Math.floor((Date.now() - ms) / 60000));
const fallit = (x) => x.resultat !== 'correcte';

function categoria(err) {
  if (err.startsWith('resposta:')) return `Càlcul: ${PREGUNTA[err.slice(9).split(':')[0]] || 'resposta'}`;
  return CATEGORIA[err.split(':')[0]] || null;
}

/** un error desat («codi:a:b» o «resposta:valor») en paraules planeres */
function errorPla(err, intent) {
  if (err.startsWith('resposta:')) {
    const valor = err.slice(9);
    const r = S.D.reptes.reptes.find((x) => x.codi === intent.repte);
    const qs = r ? [...(r.preguntes || []), ...r.nivells.flatMap((n) => n.preguntes || [])] : [];
    const q = qs.find((x) => x.valor === valor);
    return `Resposta incorrecta: «${q?.text || PREGUNTA[valor.split(':')[0]] || valor}»`;
  }
  const [codi, ...args] = err.split(':');
  const [a, b] = args.map((x) => (x !== '' && !Number.isNaN(Number(x)) ? Number(x) : x));
  return textError([codi, a, b], { nom: nomEst, bitllets: descodifica(intent.bitllets || []), horaText });
}

/** estat d'avui d'un grup: intents, errors seguits i, si cal, per què està encallat */
function seguimentGrup(g) {
  const ints = (S.intents[g.id] || []).filter((x) => x.ms >= iniciAvui());
  if (!ints.length) return { ints, motiu: null };
  const darrer = ints[ints.length - 1];
  let seguits = 0;
  for (let k = ints.length - 1; k >= 0 && fallit(ints[k]); k--) seguits++;
  const ok = [...ints].reverse().find((x) => !fallit(x));
  const minuts = minutsDes(ok ? ok.ms : ints[0].ms);
  const actiu = minutsDes(g.darreraActivitatMs || 0) < 5;
  let motiu = null;
  if (seguits >= ENCALLAT.INTENTS && minutsDes(darrer.ms) < ENCALLAT.RECENT_MIN) motiu = `${seguits} intents seguits amb errors a ${darrer.repte}`;
  else if (actiu && seguits && minuts >= ENCALLAT.MINUTS) motiu = `${minuts} minuts sense aconseguir cap nivell`;
  return { ints, darrer, seguits, motiu };
}

/** franja «Errors de la classe»: tipus d'error repetits a diversos grups en els darrers 30 minuts */
function franjaErrors() {
  const des = Date.now() - FINESTRA_CLASSE_MIN * 60000;
  const perCat = new Map();
  for (const g of S.grups) {
    const cats = new Set();
    for (const x of S.intents[g.id] || []) {
      if (x.ms < des || !fallit(x)) continue;
      for (const e of x.errors || []) { const c = categoria(e); if (c) cats.add(c); }
    }
    for (const c of cats) perCat.set(c, [...(perCat.get(c) || []), g.nom]);
  }
  const llista = [...perCat.entries()].filter(([, gs]) => gs.length >= 2).sort((a, b) => b[1].length - a[1].length).slice(0, 5);
  if (!llista.length) return null;
  return h('div', { class: 'franja-errors', role: 'status' },
    h('span', { class: 'franja-titol' }, icona('avis', 'mini'), 'Errors de la classe'),
    llista.map(([c, gs]) => h('span', { class: `xip-error ${gs.length >= 3 ? 'fort' : ''}`, title: gs.join(', ') }, c, h('b', {}, `${gs.length} grups`))),
    h('span', { class: 'franja-nota' }, 'Darrers 30 minuts'));
}

/** al detall del grup: on treballen ara, el viatge en curs i els darrers errors */
function detallAra(g) {
  const sg = seguimentGrup(g);
  const caixa = h('div', { class: `detall-ara ${sg.motiu ? 'encallat' : ''}` });
  const codi = g.repteActual;
  const r = S.D.reptes.reptes.find((x) => x.codi === codi);
  const doc = S.progres[g.id]?.[codi];
  if (r) {
    const nivell = r.modalitat === 'escala' && doc?.esborrany?.nivell ? ` · ${TEXTOS.nivells[doc.esborrany.nivell - 1]}` : '';
    caixa.append(h('p', { class: 'ara-titol' }, h('span', { class: 'codi-repte', style: `--c: var(--b${S.AG.BLOC[codi]})` }, codi),
      `Ara: ${r.titol}${nivell}`, minutsDes(g.darreraActivitatMs || 0) < 60 ? h('span', { class: 'ara-temps' }, `fa ${minutsDes(g.darreraActivitatMs)} min`) : null));
  }
  if (sg.motiu) caixa.append(h('p', { class: 'ara-encallat' }, icona('avis', 'mini'), `Encallat: ${sg.motiu}.`));
  if (doc?.esborrany?.bitllets?.length && doc.estat !== 'lliurat') caixa.append(h('p', { class: 'nota' }, 'Viatge en curs:'), resumViatge(descodifica(doc.esborrany.bitllets), doc.esborrany.intents));
  const errors = (S.intents[g.id] || []).filter((x) => fallit(x) && x.errors?.length).slice(-4).reverse();
  if (errors.length) {
    caixa.append(h('p', { class: 'nota' }, 'Darrers errors:'), h('ul', { class: 'errors-recents' }, errors.map((x) => h('li', {},
      h('span', { class: 'err-quan' }, `${x.repte} · fa ${minutsDes(x.ms)} min`),
      h('span', {}, [...new Set(x.errors.slice(0, 2).map((e) => errorPla(e, x)))].join(' '))))));
  } else if (sg.ints.length) {
    caixa.append(h('p', { class: 'nota' }, 'Avui no hi ha errors desats.'));
  }
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
  caixa.replaceChildren(h('p', { class: 'targetes-tall' }, icona('tisores'), 'Retalleu per les línies discontínues: una targeta per grup.'),
    ...S.grups.map((g) => h('div', { class: 'targeta-acces' },
    h('div', { class: 'targeta-cap' }, h('img', { src: 'favicon.svg', alt: '' }), h('strong', {}, 'Pròxima sortida'), h('span', { class: 'targeta-tanda' }, S.tanda.nom)),
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
