/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Panell docent: crea la tanda, obre els blocs, activa la via tallada,
   segueix cada grup, marca les ajudes, imprimeix les targetes i exporta els resultats.
   Els punts es recalculen sempre amb l'avaluador a partir dels bitllets i les respostes desats. */
import { STORAGE_KEYS, NOMS_GRUPS, LIMITS, VERSIO_APP } from './config.js';
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
  if (desada && await S.M.get(`tandes/${desada}`).catch(() => null)) obreTanda(desada);
  else pantallaTandes();
}

/* ================================================================ tandes */
async function pantallaTandes() {
  for (const d of [...S.desubs, ...S.desubsGrups]) d();
  S.desubs = []; S.desubsGrups = []; S.tandaId = null;
  document.getElementById('capcalera-dreta').replaceChildren(h('span', { class: 'etiqueta-mode' }, S.M.mode === 'local' ? 'Mode local' : 'Connectat'));
  const meves = (await S.M.list('tandes', ['propietariUid', S.M.uid()]).catch(() => []))
    .sort((a, b) => b.creadaMs - a.creadaMs);
  const nGrups = h('select', { id: 'ngrups' }, Array.from({ length: LIMITS.MAX_GRUPS }, (_, i) => i + 1)
    .map((n) => h('option', { value: n, selected: n === 6 }, n)));
  const nom = h('input', { id: 'nom-tanda', maxlength: LIMITS.MAX_NOM_TANDA, value: `Tanda ${meves.length + 1}` });
  const noms = h('div', { class: 'noms-grups' });
  const pintaNoms = () => noms.replaceChildren(...Array.from({ length: Number(nGrups.value) }, (_, i) =>
    h('input', { class: 'nom-grup', maxlength: 24, value: NOMS_GRUPS[i] || `Grup ${i + 1}`, 'aria-label': `Nom del grup ${i + 1}` })));
  nGrups.addEventListener('change', pintaNoms);
  pintaNoms();
  const crea = async () => {
    const llista = [...noms.querySelectorAll('input')].map((x) => x.value.trim()).filter(Boolean);
    if (!nom.value.trim() || !llista.length) return;
    const { tandaId } = await S.AG.creaTanda({ nom: nom.value.trim(), noms: llista });
    obreTanda(tandaId);
  };
  $main().replaceChildren(h('div', { class: 'docent-tandes' },
    h('section', { class: 'targeta' },
      h('h2', {}, 'Nova tanda'),
      h('label', { class: 'etiqueta', for: 'nom-tanda' }, 'Nom'), nom,
      h('label', { class: 'etiqueta', for: 'ngrups' }, 'Nombre de grups'), nGrups,
      h('p', { class: 'etiqueta' }, 'Noms dels grups'), noms,
      h('p', { class: 'nota' }, 'Els noms no poden ser noms d\'alumnes. L\'app genera el codi de la tanda i un PIN per grup.'),
      h('button', { class: 'boto primari', onclick: crea }, 'Crea la tanda', icona('fletxa'))),
    h('section', { class: 'targeta' },
      h('h2', {}, 'Les vostres tandes'),
      meves.length ? h('ul', { class: 'llista-tandes' }, meves.map((t) => h('li', {},
        h('button', { class: 'boto-tanda', onclick: () => obreTanda(t.id) },
          h('strong', {}, t.nom), h('span', {}, `Codi ${t.codi} · ${t.grups.length} grups · ${t.estat === 'tancada' ? 'tancada' : `bloc ${t.blocObert}`}`)))))
        : h('p', { class: 'buit' }, 'Encara no n\'hi ha cap.'),
      S.M.mode === 'local' ? h('p', { class: 'nota' }, 'Mode local: la tanda només existeix en aquest navegador. L\'alumnat ha d\'entrar des d\'aquest mateix aparell (index.html).') : null)));
}

/* ================================================================ una tanda */
function obreTanda(tandaId) {
  for (const d of [...S.desubs, ...S.desubsGrups]) d();
  S.desubs = []; S.desubsGrups = [];
  S.tandaId = tandaId; S.progres = {}; S.membres = {}; S.valoracio = {}; S.detall = null;
  localStorage.setItem(STORAGE_KEYS.DOCENT, tandaId);
  const base = `tandes/${tandaId}`;
  S.desubs.push(S.M.watch(base, (t) => { S.tanda = t; pinta(); }));
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
  pintant = true;
  requestAnimationFrame(() => { pintant = false; pintaTanda(); });
}

const ajudesDe = (gid) => S.valoracio[gid]?.ajuda || [];

function actualitza(camps) {
  return S.M.update(`tandes/${S.tandaId}`, camps).catch(() => avis('No s\'ha pogut desar el canvi.', 'error'));
}

function pintaTanda() {
  const t = S.tanda;
  document.getElementById('capcalera-dreta').replaceChildren(
    h('button', { class: 'boto petit', onclick: imprimeixTargetes }, icona('impressora'), 'Targetes d\'accés'),
    h('button', { class: 'boto petit', onclick: exportaCSV }, icona('baixa'), 'Exporta CSV'),
    h('button', { class: 'boto petit', onclick: pantallaTandes }, 'Tandes'),
    h('span', { class: 'etiqueta-mode' }, S.M.mode === 'local' ? 'Mode local' : 'Connectat'));
  const blocs = h('div', { class: 'segmentat', role: 'group', 'aria-label': 'Bloc obert' },
    S.D.reptes.blocs.map((b) => h('button', {
      class: b.bloc <= t.blocObert ? 'actiu' : '', 'aria-pressed': b.bloc === t.blocObert ? 'true' : 'false',
      title: `${b.titol} (${b.reptes.join(', ')})`,
      onclick: () => actualitza({ blocObert: b.bloc, estat: 'en_curs' })
    }, `${b.bloc} · ${b.titol}`)));
  const barra = h('section', { class: 'barra-tanda targeta' },
    h('div', { class: 'tanda-id' }, h('h1', {}, t.nom),
      h('p', {}, 'Codi de la tanda ', h('strong', { class: 'codi-gran' }, t.codi))),
    h('div', { class: 'tanda-controls' },
      h('div', {}, h('p', { class: 'etiqueta' }, 'Blocs oberts'), blocs),
      h('label', { class: `interruptor ${t.avisViaTallada ? 'on' : ''}` },
        h('input', { type: 'checkbox', checked: t.avisViaTallada, onchange: (e) => actualitza({ avisViaTallada: e.target.checked }) }),
        icona('avis'), 'Avís de via tallada')),
    h('div', { class: 'tanda-accions' },
      t.estat === 'tancada'
        ? h('button', { class: 'boto', onclick: () => actualitza({ estat: 'en_curs' }) }, 'Reobre la tanda')
        : h('button', { class: 'boto perill', onclick: () => actualitza({ estat: 'tancada' }) }, 'Tanca la tanda')));
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
  const url = new URL('./', location.href).href.replace(/\/$/, '');
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
