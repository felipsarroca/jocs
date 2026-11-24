/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* App de l'alumnat: accés, encàrrecs (repte), guixeta i resposta.
   L'app no fa cap càlcul per l'alumnat: mostra horaris i preus dels bitllets, però no
   suma preus ni calcula esperes. L'avaluador només diu què falla. */
import { STORAGE_KEYS, LIMITS, DEMO, NOMS_GRUPS } from './config.js';
import { obreMagatzem } from './magatzem.js';
import { creaAvaluador } from './avaluador.js';
import { creaAgencia, codificaBitllet, descodifica } from './agencia.js';
import { textError, TEXTOS } from './textos.js';
import { iniciaEscala } from './escala.js';
import { h, icona, horaDia, horaAmbDia, horaText, euros, punts, llegeixHora, nombre, avis } from './ui.js';

const S = {
  D: null, A: null, M: null, AG: null,
  acces: null, tanda: null, grup: null, valoracio: null, progres: {}, progresCarregat: false,
  actiu: null, esb: null, vista: { estacio: 'B', dia: 1, tren: null },
  resultat: null, confirma: false, desarTimer: null, desubs: [],
  triaEstacio: false, puntsVistos: null, guiaVista: false, bitlletNou: -1
};

const $main = () => document.getElementById('main');
const nomEst = (s) => S.D.estacions[s]?.nom ?? s;

/* ================================================================ arrencada */
async function inicia() {
  iniciaEscala();
  try {
    const resp = await fetch('dades/dades.json', { cache: 'no-cache' });
    S.D = await resp.json();
  } catch (_) {
    $main().replaceChildren(h('p', { class: 'error-gran' }, 'No s\'han pogut carregar les dades de l\'app.'));
    return;
  }
  S.A = creaAvaluador(S.D);
  S.M = await obreMagatzem();
  S.AG = creaAgencia(S.M, S.D, S.A);
  try { S.acces = JSON.parse(localStorage.getItem(STORAGE_KEYS.ACCES) || 'null'); } catch (_) { S.acces = null; }
  if (S.acces && await S.AG.esMembre(S.acces.tandaId, S.acces.grupId)) obreAgencia();
  else if (DEMO) entraDemo();
  else pantallaAcces();
}

/* ================================================================ demostració */
/** Crea una tanda de prova local (totes les trobades ja han passat) i hi entra com el primer grup. */
async function entraDemo() {
  const DIA = 86400000;
  const avui = new Date(); avui.setHours(0, 0, 0, 0);
  const t0 = avui.getTime() - 4 * DIA;
  const { tandaId, pins } = await S.AG.creaTanda({
    nom: 'Demostració', noms: NOMS_GRUPS.slice(0, 6),
    calendari: [t0, t0 + DIA, t0 + 2 * DIA, t0 + 3 * DIA], clau: Math.random().toString(36)
  });
  await S.M.update(`tandes/${tandaId}`, { demo: true, estat: 'en_curs' });
  await S.AG.entra(tandaId, 'g1', pins.g1);
  S.acces = { tandaId, grupId: 'g1' };
  localStorage.setItem(STORAGE_KEYS.ACCES, JSON.stringify(S.acces));
  localStorage.setItem(STORAGE_KEYS.DOCENT, tandaId);
  obreAgencia();
}

function reiniciaDemo() {
  for (const k of Object.values(STORAGE_KEYS)) localStorage.removeItem(k);
  location.reload();
}

function barraDemo() {
  let b = document.getElementById('barra-demo');
  if (!DEMO) return;
  if (!b) {
    b = h('div', { id: 'barra-demo', class: 'barra-demo', role: 'note' },
      h('strong', {}, 'Demostració'),
      h('span', {}, 'Tots els encàrrecs oberts · només en aquest navegador'),
      h('button', { class: 'boto petit', onclick: reiniciaDemo }, 'Torna a començar'),
      h('a', { class: 'boto petit', href: 'docent.html?demo' }, icona('persona'), 'Panell del professorat'),
      h('a', { class: 'boto petit', href: './' }, 'Surt de la demo'));
    document.querySelector('.capcalera')?.after(b);
  }
}

/* ================================================================ accés */
function pantallaAcces(pas = 'codi', tanda = null, missatge = '') {
  document.getElementById('carril').hidden = true;
  document.getElementById('capcalera-dreta').replaceChildren(
    h('a', { class: 'boto petit', href: 'docent.html' }, icona('persona'), 'Professorat'));
  document.getElementById('nom-agencia').textContent = TEXTOS.lema;
  const passos = ['codi', 'grup', 'pin'];
  const k = passos.indexOf(pas);
  const caixa = h('section', { class: 'acces targeta' },
    h('h2', {}, TEXTOS.acces.titol),
    h('ol', { class: 'passos', 'aria-label': 'Passos' }, ['Codi', 'Grup', 'PIN'].map((t, i) =>
      h('li', { class: i < k ? 'fet' : i === k ? 'actual' : '' }, h('span', {}, i < k ? icona('check', 'mini') : i + 1), t))));
  if (pas === 'codi') {
    const inp = h('input', { id: 'codi', class: 'camp-codi', maxlength: 4, autocomplete: 'off', spellcheck: 'false', 'aria-label': TEXTOS.acces.codi, placeholder: 'K7Q2' });
    const envia = async () => {
      const codi = inp.value.trim().toUpperCase();
      if (codi.length !== 4) return;
      const t = await S.AG.tandaDelCodi(codi).catch(() => null);
      if (!t) return pantallaAcces('codi', null, TEXTOS.acces.codiDolent);
      pantallaAcces('grup', t);
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') envia(); });
    caixa.append(h('label', { for: 'codi', class: 'etiqueta' }, TEXTOS.acces.codi), inp,
      h('button', { class: 'boto primari', onclick: envia }, 'Continua', icona('fletxa')));
    setTimeout(() => inp.focus(), 50);
  } else if (pas === 'grup') {
    caixa.append(h('p', { class: 'etiqueta' }, TEXTOS.acces.grup),
      h('div', { class: 'graella-grups' }, tanda.grups.map((g, i) =>
        h('button', { class: 'boto-grup', style: `--c: var(--b${(i % 4) + 1})`, onclick: () => pantallaAcces('pin', { ...tanda, grup: g }) }, icona('tren'), g.nom))),
      h('button', { class: 'boto enrere', onclick: () => pantallaAcces('codi') }, 'Enrere'));
  } else {
    const inp = h('input', { id: 'pin', class: 'camp-codi', maxlength: 4, inputmode: 'numeric', autocomplete: 'off', 'aria-label': TEXTOS.acces.pin, placeholder: '····' });
    const envia = async () => {
      try {
        await S.AG.entra(tanda.tandaId, tanda.grup.id, inp.value.trim());
        S.acces = { tandaId: tanda.tandaId, grupId: tanda.grup.id };
        localStorage.setItem(STORAGE_KEYS.ACCES, JSON.stringify(S.acces));
        obreAgencia();
      } catch (e) {
        pantallaAcces('pin', tanda, e.message === 'PIN' ? TEXTOS.acces.pinDolent : TEXTOS.acces.xarxa);
      }
    };
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') envia(); });
    caixa.append(h('p', { class: 'grup-triat' }, icona('tren'), tanda.grup.nom),
      h('label', { for: 'pin', class: 'etiqueta' }, TEXTOS.acces.pin), inp,
      h('div', { class: 'fila-botons' },
        h('button', { class: 'boto enrere', onclick: () => pantallaAcces('grup', tanda) }, 'Enrere'),
        h('button', { class: 'boto primari', onclick: envia }, TEXTOS.acces.entra, icona('fletxa'))));
    setTimeout(() => inp.focus(), 50);
  }
  if (missatge) caixa.append(h('p', { class: 'missatge-error', role: 'alert' }, missatge));
  if (S.M.mode === 'local') caixa.append(h('p', { class: 'nota-local' }, TEXTOS.acces.local));
  const heroi = h('div', { class: 'acces-heroi' },
    h('img', { src: 'assets/escena.svg', alt: '', width: 640, height: 400 }),
    h('h1', {}, 'Pròxima ', h('em', {}, 'sortida')),
    h('p', {}, TEXTOS.acces.lema));
  $main().replaceChildren(h('div', { class: 'pantalla-acces' }, h('div', { class: 'acces-graella' }, heroi, caixa)));
}

function surt() {
  for (const d of S.desubs) d();
  S.desubs = [];
  localStorage.removeItem(STORAGE_KEYS.ACCES);
  S.acces = null; S.actiu = null; S.esb = null; S.progres = {}; S.progresCarregat = false;
  S.tanda = null; S.grup = null; S.valoracio = null; S.puntsVistos = null; S.guiaVista = false;
  const nom = document.getElementById('nom-agencia');
  nom.classList.remove('oficina');
  pantallaAcces();
}

/* ================================================================ agència */
function obreAgencia() {
  const { tandaId, grupId } = S.acces;
  const base = `tandes/${tandaId}`;
  S.progresCarregat = false;
  S.desubs.push(S.M.watch(base, (t) => { S.tanda = t; pinta(); }));
  S.desubs.push(S.M.watch(`${base}/grups/${grupId}`, (g) => { S.grup = g; pinta(); }));
  S.desubs.push(S.M.watch(`${base}/valoracio/${grupId}`, (v) => { S.valoracio = v; pinta(); }));
  // els blocs s'obren sols segons el calendari: es torna a mirar cada minut
  const rellotge = setInterval(pinta, 60000);
  S.desubs.push(() => clearInterval(rellotge));
  S.desubs.push(S.M.watch(`${base}/grups/${grupId}/reptes`, (docs) => {
    S.progres = Object.fromEntries(docs.map((d) => [d.id, d]));
    S.progresCarregat = true;
    pinta();
  }));
}

const camiRepte = (codi) => `tandes/${S.acces.tandaId}/grups/${S.acces.grupId}/reptes/${codi}`;
const ajudes = () => S.valoracio?.ajuda || [];

function repteObert() {
  const estats = S.AG.estatReptes(S.tanda, S.progres);
  if (S.actiu && estats[S.actiu] !== 'bloquejat') return S.actiu;
  return S.AG.ORDRE.find((c) => estats[c] === 'obert') || S.actiu || 'R1';
}

let pintant = false;
function pinta() {
  // no es pinta fins que arriba el progrés desat: si no, l'esborrany buit podria sobreescriure el bo
  if (!S.tanda || !S.grup || !S.progresCarregat || pintant) return;
  pintant = true;
  requestAnimationFrame(() => {
    pintant = false;
    const codi = repteObert();
    if (codi !== S.esb?.codi) obreRepte(codi);
    pintaCapcalera();
    pintaCarril();
    pintaPrincipal();
  });
}

function pintaCapcalera() {
  barraDemo();
  const { total } = S.AG.puntsGrup(S.progres, ajudes());
  const nom = document.getElementById('nom-agencia');
  nom.classList.add('oficina');
  nom.replaceChildren(icona('tren', 'mini'), `Oficina ${S.grup.nom}`);
  const salta = S.puntsVistos != null && total > S.puntsVistos;
  S.puntsVistos = total;
  document.getElementById('capcalera-dreta').replaceChildren(
    h('button', { class: 'boto-rodo', onclick: mostraGuia, title: 'Com funciona', 'aria-label': 'Com funciona' }, icona('ajuda')),
    h('div', { class: `reputacio ${salta ? 'punts-salt' : ''}`, title: 'Punts de reputació de l\'agència' },
      icona('estrella'),
      h('div', { class: 'reputacio-cos' },
        h('p', {}, h('strong', {}, punts(total)), h('span', {}, ' / 4.000 punts')),
        h('div', { class: 'reputacio-barra', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 4000, 'aria-valuenow': total, 'aria-label': 'Punts de reputació' },
          h('i', { style: `width:${Math.min(100, total / 40)}%` })))),
    ...(DEMO ? [] : [h('button', { class: 'boto petit fantasma boto-surt', onclick: surt, title: 'Surt d\'aquest aparell' }, icona('sortida'), h('span', {}, TEXTOS.botons.surt))]));
  if (!S.guiaVista) {
    S.guiaVista = true;
    const clau = `${STORAGE_KEYS.ACCES}:guia:${S.acces.tandaId}:${S.acces.grupId}`;
    if (!localStorage.getItem(clau)) { localStorage.setItem(clau, '1'); mostraGuia(); }
  }
}

/* ================================================================ guia «Com funciona» */
function mostraGuia() {
  const pas = (n, ic, titol, text) => h('li', {},
    h('span', { class: 'guia-dibuix', 'aria-hidden': 'true' }, h('b', {}, n), icona(ic)),
    h('div', {}, h('strong', {}, titol), h('br'), h('span', {}, text)));
  obreModal(h('div', { class: 'modal guia', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'guia-titol' },
    h('h2', { id: 'guia-titol' }, 'Com funciona'),
    h('ol', { class: 'guia-passos' },
      pas(1, 'encarrec', 'Llegiu l\'encàrrec', 'Un client us demana un viatge.'),
      pas(2, 'bitllet', 'Compreu els bitllets', 'Toqueu un tren a la guixeta i compreu fins on baixeu.'),
      pas(3, 'calculadora', 'Calculeu i comproveu', 'Escriviu les respostes i premeu «Comprova».')),
    h('div', { class: 'guia-nivells' },
      h('span', {}, 'Cada encàrrec té tres nivells:'),
      TEXTOS.nivells.flatMap((n, i) => [i ? icona('fletxa', 'mini') : null, h('span', { class: 'xip' }, icona('estrella', 'mini'), n)]),
      h('span', { class: 'guia-nota' }, 'El Regional obre l\'encàrrec següent. Els altres nivells donen més punts.')),
    h('div', { class: 'fila-botons' }, h('button', { class: 'boto primari gran', onclick: tancaModal, autofocus: true }, 'Som-hi!', icona('fletxa')))));
}

function obreModal(contingut) {
  tancaModal();
  const capa = h('div', { class: 'capa-modal', id: 'capa-modal', onclick: (e) => { if (e.target === capa) tancaModal(); } }, contingut);
  document.body.append(capa);
  document.addEventListener('keydown', escModal);
  setTimeout(() => (capa.querySelector('[autofocus]') || capa.querySelector('button'))?.focus(), 30);
}

function tancaModal() {
  document.getElementById('capa-modal')?.remove();
  document.removeEventListener('keydown', escModal);
}

function escModal(e) { if (e.key === 'Escape') tancaModal(); }

/** finestra de celebració quan s'aconsegueix un nivell */
function celebra({ titol, pts, text, pendents, botons }) {
  const colors = ['var(--b1)', 'var(--b2)', 'var(--b3)', 'var(--b4)', 'var(--sol)'];
  const confeti = h('div', { class: 'confeti', 'aria-hidden': 'true' }, Array.from({ length: 36 }, (_, i) =>
    h('i', { style: `left:${(i * 37) % 100}%; background:${colors[i % colors.length]}; animation-delay:${(i % 9) * 0.07}s; animation-duration:${1.4 + (i % 5) * 0.2}s` })));
  obreModal(h('div', { class: 'modal celebra', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'celebra-titol' },
    confeti,
    h('div', { class: 'celebra-estrella', 'aria-hidden': 'true' }, icona('estrella')),
    pts ? h('p', { class: 'celebra-punts' }, `+${punts(pts)} punts`) : null,
    h('h2', { id: 'celebra-titol' }, titol),
    text ? h('p', {}, text) : null,
    pendents,
    h('div', { class: 'fila-botons' }, botons)));
}

function pintaCarril() {
  const nav = document.getElementById('carril');
  nav.hidden = false;
  const estats = S.AG.estatReptes(S.tanda, S.progres);
  nav.replaceChildren(...S.D.reptes.blocs.map((b) => {
    const tancat = b.bloc > S.AG.blocActual(S.tanda);
    return h('div', { class: `tram ${tancat ? 'tancat' : ''}`, style: `--bloc: var(--b${b.bloc}); flex: ${b.reptes.length} 1 0`, title: `Bloc ${b.bloc} · ${b.titol}` },
      h('p', { class: 'tram-nom' }, h('b', {}, tancat ? icona('cadenat', 'mini') : b.bloc), h('span', {}, b.titol)),
      h('div', { class: 'tram-parades' }, b.reptes.map((c) => {
        const r = S.AG.R[c];
        const est = estats[c];
        const actiu = c === S.esb?.codi;
        const niv = S.AG.puntsRepte(c, S.progres, ajudes()).nivell;
        return h('button', {
          class: `parada-linia ${est} ${actiu ? 'actiu' : ''}`,
          disabled: est === 'bloquejat', 'aria-current': actiu ? 'step' : null, title: r.titol,
          onclick: () => { S.actiu = c; obreRepte(c); pinta(); }
        },
        h('span', { class: 'parada-punt' }, est === 'lliurat' ? icona('check') : est === 'bloquejat' ? icona('cadenat') : c.slice(1)),
        h('span', { class: 'parada-titol' }, r.titol),
        h('span', { class: 'carril-punts' }, [1, 2, 3].map((n) => h('i', { class: n <= niv ? 'ple' : '' }))));
      })));
  }));
}

/* ================================================================ esborrany del repte */
function obreRepte(codi) {
  const r = S.AG.R[codi];
  const doc = S.progres[codi] || {};
  const e = doc.esborrany || {};
  let nivell = e.nivell;
  if (r.modalitat === 'escala' && !nivell) nivell = (r.nivells.find((n) => !doc.nivells?.[n.nivell]) || r.nivells[2]).nivell;
  S.esb = {
    codi, nivell: nivell || 1,
    bitllets: descodifica(e.bitllets), entrades: e.entrades || {}, intents: e.intents || 0
  };
  S.resultat = null; S.confirma = false;
  const ult = S.esb.bitllets[S.esb.bitllets.length - 1];
  S.vista = { estacio: ult ? ult[3] : 'B', dia: ult ? ult[0] : 1, tren: null };
  if (codi === 'R9' && doc.estat !== 'lliurat') preparaViaTallada(doc);
}

async function preparaViaTallada(doc) {
  if (doc.tall) {
    if (!S.esb.bitllets.length) S.esb.bitllets = [doc.tall.primer];
    return;
  }
  const tall = S.AG.calculaTall(S.progres);
  if (!tall) return;
  S.esb.bitllets = [tall.primer];
  S.vista = { estacio: tall.primer[3], dia: 1, tren: null };
  await S.M.set(camiRepte('R9'), { ...doc, codi: 'R9', estat: 'obert', tall, esborrany: esborranyDesable(), actualitzatMs: Date.now() });
}

function esborranyDesable() {
  return { nivell: S.esb.nivell, bitllets: S.esb.bitllets.map(codificaBitllet), entrades: S.esb.entrades, intents: S.esb.intents };
}

function desaAviat() {
  clearTimeout(S.desarTimer);
  S.desarTimer = setTimeout(desaEsborrany, LIMITS.SEGONS_DESAT * 1000);
}

async function desaEsborrany(extra = {}) {
  clearTimeout(S.desarTimer);
  if (!S.esb) return;
  const codi = S.esb.codi;
  const doc = S.progres[codi] || { codi, estat: 'obert' };
  if (doc.estat === 'lliurat') return;
  const nou = { ...doc, codi, estat: doc.estat || 'obert', esborrany: esborranyDesable(), actualitzatMs: Date.now(), ...extra };
  delete nou.id;
  const p = S.AG.puntsRepte(codi, { ...S.progres, [codi]: nou }, []);
  nou.punts = p.base;
  nou.nivellAssolit = p.nivell;
  try {
    await S.M.set(camiRepte(codi), nou);
    const { total, perRepte } = S.AG.puntsGrup({ ...S.progres, [codi]: nou }, ajudes());
    await S.M.update(`tandes/${S.acces.tandaId}/grups/${S.acces.grupId}`, {
      repteActual: codi, punts: total, darreraActivitatMs: Date.now(),
      nivells: Object.fromEntries(Object.entries(perRepte).map(([c, p]) => [c, p.nivell]))
    });
  } catch (e) {
    avis('No s\'ha pogut desar. Comproveu la connexió.', 'error');
  }
}

/* ================================================================ pantalla principal */
function pintaPrincipal() {
  const codi = S.esb.codi;
  const r = S.AG.R[codi];
  const doc = S.progres[codi] || {};
  const estat = S.AG.estatReptes(S.tanda, S.progres)[codi];
  if (S.tanda.estat === 'tancada') {
    $main().replaceChildren(h('section', { class: 'missatge-centre targeta' }, h('h2', {}, 'La tanda s\'ha tancat'),
      h('p', {}, 'Gràcies per viatjar amb Pròxima sortida.')));
    return;
  }
  if (estat === 'bloquejat') {
    $main().replaceChildren(h('section', { class: 'missatge-centre targeta' }, icona('cadenat', 'gran'),
      h('h2', {}, 'Aquest encàrrec encara no és obert'),
      h('p', {}, codi === 'R9' ? 'El docent us avisarà quan arribi la notícia de la via.' : 'Acabeu l\'encàrrec anterior o espereu que el docent obri el bloc.')));
    return;
  }
  // el pas que toca ara: comprar bitllets (2) o calcular i comprovar (3)
  const fixos = codi === 'R9' ? 1 : 0;
  const pas = estat === 'lliurat' ? 0 : S.esb.bitllets.length > fixos ? 3 : 2;
  const graella = h('div', { class: 'graella-agencia' },
    columnaRepte(r, doc, estat),
    estat === 'lliurat' ? columnaLliurat(r, doc) : columnaGuixeta(r, pas === 2),
    estat === 'lliurat' ? null : columnaResposta(r, doc, pas === 3));
  graella.classList.toggle('lliurat', estat === 'lliurat');
  graella.style.setProperty('--bloc', `var(--b${S.AG.BLOC[codi]})`);
  // es conserva la posició de la guixeta en tornar a pintar
  const scroll = [...document.querySelectorAll('.graella-agencia > .col')].map((c) => c.scrollTop);
  $main().replaceChildren(graella);
  [...graella.children].forEach((c, k) => { if (scroll[k]) c.scrollTop = scroll[k]; });
}

/** capçalera numerada de cada columna: 1 encàrrec, 2 guixeta, 3 viatge */
function capCol(n, ic, titol, ...extra) {
  return h('div', { class: 'cap-col' }, h('span', { class: 'pas-num', 'aria-hidden': 'true' }, n), h('h2', {}, icona(ic), titol), ...extra);
}

function nivellActual(r) {
  return r.modalitat === 'escala' ? r.nivells.find((n) => n.nivell === S.esb.nivell) : r.nivells[0];
}

function condicionsActuals(r) {
  return S.A.condicions(nivellActual(r).viatge);
}

function maxDia(r) {
  const c = condicionsActuals(r);
  return c.termini ? Number(c.termini.split(' ')[0].slice(1)) : 1;
}

const preuReparacio = (n, doc) => {
  const m = doc.tall?.minim;
  if (m == null) return '…';
  return String(m + (n.viatge.marge_reparacio ?? 0));
};

/* ---------------------------------------------------------------- 1 · encàrrec */
function columnaRepte(r, doc, estat) {
  const col = h('section', { class: 'col col-repte', 'aria-label': 'Encàrrec' });
  col.append(capCol(1, 'encarrec', 'Encàrrec'),
    h('div', { class: 'client' },
      h('div', { class: 'client-icona', 'aria-hidden': 'true' }, inicials(r.client)),
      h('div', {}, h('p', { class: 'client-nom' }, r.client), h('h3', { class: 'repte-titol' }, r.titol))),
    h('p', { class: 'encarrec' }, r.encarrec));

  if (r.codi === 'R9' && doc.tall) col.append(avisTall(doc.tall));

  const assolit = S.AG.puntsRepte(r.codi, S.progres, ajudes()).nivell;
  const ptsNivell = (n) => (ajudes().includes(`${r.codi}.${n.nivell}`) ? n.punts / 2 : n.punts);
  const pips = (k) => h('span', { class: 'pips', 'aria-hidden': 'true' }, [1, 2, 3].map((x) => h('i', { class: x <= k ? 'ple' : '' })));
  const tic = () => h('span', { class: 'tic', 'aria-label': 'aconseguit' }, icona('check'));

  if (r.modalitat === 'escala') {
    // la petició del nivell que toca, ben visible
    if (estat !== 'lliurat') {
      if (assolit === 3) {
        col.append(h('div', { class: 'missio fet' },
          h('p', { class: 'missio-text' }, 'Heu aconseguit els tres nivells! Lliureu l\'encàrrec.')));
      } else {
        const n = nivellActual(r);
        col.append(h('div', { class: 'missio' },
          h('div', { class: 'missio-cap' },
            h('span', { class: 'missio-etiqueta' }, pips(n.nivell), TEXTOS.nivells[n.nivell - 1]),
            h('span', { class: 'missio-punts' }, `+${ptsNivell(n)} punts`)),
          h('p', { class: 'missio-text' }, n.enunciat)));
      }
    }
    col.append(h('div', { class: 'nivells', role: 'list', 'aria-label': 'Nivells' }, r.nivells.map((n) => {
      const fet = n.nivell <= assolit;
      const actual = estat !== 'lliurat' && n.nivell === S.esb.nivell && assolit < 3;
      return h('div', { class: `nivell ${fet ? 'fet' : ''} ${actual ? 'actual' : ''}`, role: 'listitem' },
        fet ? tic() : null,
        h('span', { class: 'nivell-nom' }, TEXTOS.nivells[n.nivell - 1]),
        h('span', { class: 'nivell-punts' }, `${ptsNivell(n)} punts`));
    })));
  } else {
    // encàrrecs de millora: un sol viatge i tres objectius
    if (estat !== 'lliurat') {
      col.append(h('div', { class: 'missio' },
        h('div', { class: 'missio-cap' }, h('span', { class: 'missio-etiqueta' }, icona('mapa', 'mini'), 'Un sol viatge')),
        h('p', { class: 'missio-text' }, r.enunciat)));
    }
    col.append(h('ol', { class: 'objectius', 'aria-label': 'Nivells' }, r.nivells.map((n) => {
      const fet = n.nivell <= assolit;
      return h('li', { class: `objectiu ${fet ? 'fet' : ''}` },
        h('span', { class: 'objectiu-nom' }, fet ? tic() : null, TEXTOS.nivells[n.nivell - 1]),
        h('span', { class: 'objectiu-text' }, n.enunciat.replace('[PREU]', preuReparacio(n, doc))),
        h('span', { class: 'objectiu-punts' }, `${ptsNivell(n)} punts`));
    })));
  }
  if (r.regles.length) {
    col.append(h('div', { class: 'regles' }, r.regles.map((id) => {
      const reg = S.D.reptes.regles.find((x) => x.id === id);
      return h('span', { class: 'regla', title: reg.text }, icona(reg.icona), reg.curt || reg.text);
    })));
  }
  if ((r.codi === 'R8' || r.codi === 'R9') && estat !== 'lliurat') col.append(viatgeOriginal());
  return col;
}

/** «La família Garcia» -> «G»; «L'Ahmed i la Marta» -> «AM» */
function inicials(nom) {
  const net = nom.replace(/\b(la|el|en|na|els|les|i|família)\b/gi, ' ').replace(/L'/g, ' ');
  return net.split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0].toUpperCase()).join('');
}

function avisTall(tall) {
  const [a, b] = tall.tram;
  return h('div', { class: 'avis-tall', role: 'note' },
    h('p', { class: 'avis-tall-titol' }, icona('avis'), 'Avís: via tallada'),
    h('p', {}, `Heu baixat del tren a ${nomEst(tall.estacio)} el dia 1 a les ${horaDia(tall.arribada)}. El tram ${nomEst(a)} – ${nomEst(b)} queda tallat tot el dia ${tall.dia}, en tots dos sentits.`),
    tall.origen === 'B-01' ? h('p', { class: 'petit' }, 'Feu servir el viatge que us ha donat el docent.') : null);
}

function viatgeOriginal() {
  const orig = S.AG.viatgeOriginal(S.progres);
  if (!orig) return h('span');
  return h('details', { class: 'original' },
    h('summary', {}, icona('mapa'), 'Viatge original (repte 7)'),
    llistaBitllets(descodifica(orig.bitllets), { fix: true }));
}

/* ---------------------------------------------------------------- 2 · guixeta */
function columnaGuixeta(r, ara) {
  const dies = maxDia(r);
  if (S.vista.dia > dies) S.vista.dia = 1;
  const col = h('section', { class: `col col-guixeta ${ara ? 'pas-ara' : ''}`, 'aria-label': 'Guixeta' });
  col.append(capCol(2, 'bitllet', 'Guixeta'),
    h('button', { class: 'tria-estacio-boto', 'aria-haspopup': 'dialog', onclick: () => { S.triaEstacio = true; pintaPrincipal(); } },
      h('span', { class: 'icona-estacio', 'aria-hidden': 'true' }, icona('estacio')),
      h('span', {}, h('small', {}, 'Sortides de'), h('strong', {}, nomEst(S.vista.estacio))),
      h('span', { class: 'canvia' }, 'Canvia', icona('avall', 'mini'))));
  if (dies > 1) {
    col.append(h('div', { class: 'dies', role: 'tablist', 'aria-label': 'Dia' }, Array.from({ length: dies }, (_, i) => i + 1).map((d) =>
      h('button', { role: 'tab', class: `dia ${d === S.vista.dia ? 'actiu' : ''}`, 'aria-selected': d === S.vista.dia ? 'true' : 'false',
        onclick: () => { S.vista.dia = d; S.vista.tren = null; pintaPrincipal(); } }, icona('calendari'), `Dia ${d}`))));
  }
  if (!S.vista.tren && ara) col.append(h('p', { class: 'pista' }, icona('ma'), 'Toqueu un tren per veure on para i comprar el bitllet.'));
  const panell = h('div', { class: 'panell-sortides' },
    h('div', { class: 'panell-cap', 'aria-hidden': 'true' }, h('span', {}, 'Surt'), h('span', {}, 'Destinació'), h('span', {}, 'Para a'), h('span')));
  for (const s of sortidesDe(S.vista.estacio, S.vista.dia)) panell.append(filaSortida(s));
  if (panell.children.length === 1) panell.append(h('p', { class: 'buit' }, 'Avui no surt cap tren d\'aquesta estació.'));
  col.append(panell);
  if (S.triaEstacio) col.append(triaEstacio());
  return col;
}

/** totes les estacions amb sortides, en una graella per triar-ne una */
function triaEstacio() {
  const tanca = () => { S.triaEstacio = false; pintaPrincipal(); };
  const tria = (s) => { S.triaEstacio = false; S.vista.estacio = s; S.vista.tren = null; pintaPrincipal(); };
  const estacions = Object.keys(S.D.estacions)
    .filter((s) => sortidesDe(s, 1).length)
    .sort((x, y) => nomEst(x).localeCompare(nomEst(y), 'ca'));
  const capa = h('div', { class: 'estacions-capa', role: 'dialog', 'aria-label': 'Trieu l\'estació',
    onkeydown: (e) => { if (e.key === 'Escape') tanca(); } },
    h('div', { class: 'estacions-cap' }, icona('estacio'), h('h3', {}, 'De quina estació sortiu?'),
      h('button', { class: 'boto-icona', 'aria-label': 'Tanca', onclick: tanca }, icona('creu'))),
    h('div', { class: 'estacions' }, estacions.map((s) =>
      h('button', { class: `estacio-boto ${s === S.vista.estacio ? 'actual' : ''}`, onclick: () => tria(s) }, nomEst(s)))));
  setTimeout(() => { capa.closest('.col')?.scrollTo(0, 0); capa.querySelector('.estacio-boto.actual')?.focus(); }, 0);
  return capa;
}

function sortidesDe(est, dia) {
  const out = [];
  for (const [codi, t] of Object.entries(S.D.trens)) {
    const i = t.parades.findIndex((p) => p[0] === est);
    if (i >= 0 && i < t.parades.length - 1) out.push({ codi, i, dia, hora: t.parades[i][1] });
  }
  return out.sort((a, b) => a.hora - b.hora);
}

/* via tallada (R9): a partir de quina parada el tren ja ha passat pel tram tallat aquell dia */
function tallActiu() {
  const t = S.actiu === 'R9' ? S.progres.R9?.tall : null;
  return t ? { dia: t.dia, clau: S.A.clauTram(t.tram) } : null;
}

function primeraParadaTallada(s) {
  const tall = tallActiu();
  if (!tall || tall.dia !== s.dia) return null;
  const hop = S.A.HOP[s.codi];
  for (let j = s.i; j < hop.length; j++) if (hop[j].includes(tall.clau)) return j + 1;
  return null;
}

function filaSortida(s) {
  const t = S.D.trens[s.codi];
  const desti = t.parades[t.parades.length - 1][0];
  const obert = S.vista.tren === s.codi;
  const seguents = t.parades.slice(s.i + 1).map((p) => nomEst(p[0]));
  const tallada = primeraParadaTallada(s) !== null;
  const fila = h('div', { class: `sortida ${obert ? 'oberta' : ''} ${tallada ? 'tallada' : ''}` },
    h('button', { class: 'sortida-fila', 'aria-expanded': obert ? 'true' : 'false',
      onclick: () => { S.vista.tren = obert ? null : s.codi; pintaPrincipal(); } },
    h('span', { class: 'sortida-hora' }, horaDia(s.hora)),
    h('span', { class: 'sortida-desti' }, nomEst(desti), tallada ? h('span', { class: 'etiqueta-tall' }, icona('avis'), 'Via tallada') : null),
    h('span', { class: 'sortida-parades' }, seguents.length > 1 ? seguents.slice(0, -1).join(' · ') : 'Directe'),
    h('span', { class: 'sortida-obre', 'aria-hidden': 'true' }, icona('xevro'))));
  if (obert) fila.append(paradesTren(s));
  return fila;
}

/** les parades del tren com una línia: hora d'arribada, preu des d'aquí i «Compra» */
function paradesTren(s) {
  const t = S.D.trens[s.codi];
  const llista = h('ol', { class: 'parades' },
    h('li', { class: 'parada-origen' }, `Surt de ${nomEst(S.vista.estacio)} a les ${horaDia(s.hora)}`));
  const tall = primeraParadaTallada(s);
  let preu = 0;
  for (let j = s.i + 1; j < t.parades.length; j++) {
    if (tall !== null && j >= tall) {
      llista.append(h('li', { class: 'parada suprimida' },
        h('span', { class: 'parada-hora' }, horaDia(t.parades[j][1])),
        h('span', { class: 'parada-nom' }, nomEst(t.parades[j][0])),
        h('span', { class: 'parada-preu-buit' }),
        h('span', { class: 'parada-suprimida' }, icona('creu', 'mini'), 'Suprimit')));
      continue;
    }
    preu += t.tarifes[j - 1];
    const pas = t.recorregut[j - 1].slice(1, -1);
    if (pas.length) llista.append(h('li', { class: 'sense-parar' }, `passa per ${pas.map(nomEst).join(', ')} sense parar`));
    const [est, hora] = t.parades[j];
    const preuAra = preu;
    llista.append(h('li', { class: 'parada' },
      h('span', { class: 'parada-hora' }, horaDia(hora)),
      h('span', { class: 'parada-nom' }, nomEst(est)),
      h('span', { class: 'parada-preu' }, euros(preuAra)),
      h('button', { class: 'boto compra', onclick: () => compra(s, est), 'aria-label': `${TEXTOS.botons.compra} fins a ${nomEst(est)}` }, TEXTOS.botons.compra)));
  }
  return llista;
}

function compra(s, desti) {
  if (S.esb.bitllets.length >= LIMITS.MAX_BITLLETS) return avis('Massa bitllets.', 'error');
  S.esb.bitllets.push([s.dia, s.codi, S.vista.estacio, desti]);
  S.bitlletNou = S.esb.bitllets.length - 1;
  S.vista = { estacio: desti, dia: s.dia, tren: null };
  S.resultat = null; S.confirma = false;
  desaAviat();
  pintaPrincipal();
  S.bitlletNou = -1;
  avis(`Bitllet comprat fins a ${nomEst(desti)}`, 'ok', 1800);
}

/* ---------------------------------------------------------------- resposta */
function llistaBitllets(bitllets, { fix = false, esborrable = false } = {}) {
  const ol = h('ol', { class: 'bitllets' });
  bitllets.forEach((b, k) => {
    const [dia, tren, de, a] = b;
    const t = S.D.trens[tren];
    const st = t.parades.map((p) => p[0]);
    const i = st.indexOf(de), j = st.indexOf(a);
    let preu = 0;
    for (let x = i; x < j; x++) preu += t.tarifes[x];
    const fixat = fix || (S.esb?.codi === 'R9' && k === 0);
    ol.append(h('li', { class: `bitllet ${esborrable && k === S.bitlletNou ? 'nou' : ''}` },
      h('div', { class: 'bitllet-talo' }, h('span', { class: 'bitllet-num' }, k + 1), h('span', { class: 'bitllet-dia' }, `Dia ${dia}`)),
      h('div', { class: 'bitllet-cos' },
        h('div', { class: 'bitllet-punt' }, h('strong', {}, horaDia(t.parades[i][1])), h('span', {}, nomEst(de))),
        h('span', { class: 'bitllet-via', 'aria-hidden': 'true' }, icona('fletxa')),
        h('div', { class: 'bitllet-punt' }, h('strong', {}, horaDia(t.parades[j][1])), h('span', {}, nomEst(a)))),
      h('div', { class: 'bitllet-preu' }, h('strong', {}, euros(preu)),
        esborrable && !fixat ? h('button', { class: 'boto-icona', title: TEXTOS.botons.esborra, 'aria-label': `${TEXTOS.botons.esborra} ${k + 1}`, onclick: () => treu(k) }, icona('creu'))
          : (fixat && !fix ? h('span', { class: 'bitllet-fix', title: 'No es pot canviar' }, icona('cadenat')) : null))));
  });
  return ol;
}

function treu(k) {
  S.esb.bitllets.splice(k, 1);
  const ult = S.esb.bitllets[S.esb.bitllets.length - 1];
  S.vista = { estacio: ult ? ult[3] : 'B', dia: ult ? ult[0] : 1, tren: null };
  S.resultat = null; S.confirma = false;
  desaAviat();
  pintaPrincipal();
}

function preguntesActuals(r) {
  return S.AG.preguntesDe(r, nivellActual(r));
}

function columnaResposta(r, doc, ara) {
  const col = h('section', { class: `col col-resposta ${ara ? 'pas-ara' : ''}`, 'aria-label': 'El vostre viatge' });
  const nb = S.esb.bitllets.length;
  col.append(capCol(3, 'mapa', 'El vostre viatge', nb ? h('span', { class: 'comptador' }, `${nb} ${nb === 1 ? 'bitllet' : 'bitllets'}`) : null));
  if (!nb) col.append(h('div', { class: 'buit-viatge' }, icona('bitllet', 'gran'), h('p', {}, 'Encara no teniu bitllets.'),
    h('p', { class: 'nota' }, icona('fletxa', 'fletxa-esq'), ' Compreu-los a la guixeta.')));
  else col.append(llistaBitllets(S.esb.bitllets, { esborrable: true }));
  const pq = preguntesActuals(r);
  if (pq.length) {
    const form = h('div', { class: 'preguntes' }, h('h3', {}, icona('calculadora'), 'Calculeu i responeu'));
    for (const q of pq) form.append(campPregunta(q, r));
    col.append(form);
  }
  col.append(zonaResultat(r, doc));
  return col;
}

function entrada(q) {
  return (S.esb.entrades[q.valor] ??= {});
}

function canvia(q, camp, valor) {
  entrada(q)[camp] = valor;
  S.resultat = null; S.confirma = false;
  desaAviat();
}

function campPregunta(q, r) {
  const tipus = q.valor.split(':')[0];
  const e = entrada(q);
  const marca = S.resultat?.correctes ? S.resultat.correctes[q.valor] : null;
  const caixa = h('div', { class: `pregunta ${marca === true ? 'be' : marca === false ? 'malament' : ''}` },
    h('p', { class: 'pregunta-text' }, marca === true ? icona('check') : marca === false ? icona('creu') : null, q.text));
  const inp = (camp, attrs) => h('input', { ...attrs, value: e[camp] ?? '', oninput: (ev) => canvia(q, camp, ev.target.value) });
  const sel = (camp, opcions) => h('select', { onchange: (ev) => canvia(q, camp, ev.target.value) },
    h('option', { value: '' }, 'Tria…'), opcions.map(([v, t]) => h('option', { value: v, selected: e[camp] === v }, t)));
  const hm = () => [inp('h', { class: 'num', inputmode: 'numeric', 'aria-label': 'hores', maxlength: 3 }), h('span', {}, 'h'),
    inp('m', { class: 'num', inputmode: 'numeric', 'aria-label': 'minuts', maxlength: 2 }), h('span', {}, 'min')];
  const fila = h('div', { class: 'pregunta-camps' });
  if (tipus === 'sortida' || tipus === 'arribada') {
    if (maxDia(r) > 1) fila.append(sel('dia', Array.from({ length: maxDia(r) }, (_, i) => [String(i + 1), `Dia ${i + 1}`])));
    fila.append(inp('hora', { class: 'hora', placeholder: '00.00', inputmode: 'decimal', 'aria-label': 'hora', maxlength: 5 }));
  } else if (tipus === 'total' || tipus === 'saldo') {
    fila.append(inp('n', { class: 'num', inputmode: 'numeric', 'aria-label': 'euros', maxlength: 4 }), h('span', {}, '€'));
  } else if (tipus === 'espera' || tipus === 'estada') {
    fila.append(...hm());
  } else if (tipus === 'diferencia_euros') {
    fila.append(inp('n', { class: 'num', inputmode: 'numeric', 'aria-label': 'euros', maxlength: 4 }), h('span', {}, '€'),
      sel('dir', [['mes_car', 'més car'], ['mes_barat', 'més barat'], ['igual', 'igual']]));
  } else if (tipus === 'diferencia_hora') {
    fila.append(...hm(), sel('dir', [['despres', 'més tard'], ['abans', 'més d\'hora'], ['igual', 'igual']]));
  } else if (tipus === 'percentatge') {
    fila.append(inp('n', { class: 'num', inputmode: 'numeric', 'aria-label': 'percentatge', maxlength: 3 }), h('span', {}, '%'),
      sel('dir', [['puja', 'puja'], ['baixa', 'baixa'], ['igual', 'no canvia']]));
  } else if (tipus === 'estades') {
    const llista = h('div', { class: 'estades' });
    e.llista ??= [];
    for (let k = 0; k + 1 < S.esb.bitllets.length; k++) {
      const v = (e.llista[k] ??= {});
      const nom = nomEst(S.esb.bitllets[k][3]);
      llista.append(h('div', { class: 'estada' }, h('span', { class: 'estada-nom' }, nom),
        h('input', { class: 'num', inputmode: 'numeric', value: v.h ?? '', 'aria-label': `hores a ${nom}`, disabled: v.nit, oninput: (ev) => { v.h = ev.target.value; canvia(q, 'llista', e.llista); } }), h('span', {}, 'h'),
        h('input', { class: 'num', inputmode: 'numeric', value: v.m ?? '', 'aria-label': `minuts a ${nom}`, disabled: v.nit, oninput: (ev) => { v.m = ev.target.value; canvia(q, 'llista', e.llista); } }), h('span', {}, 'min'),
        h('label', { class: 'nit' }, h('input', { type: 'checkbox', checked: !!v.nit, onchange: (ev) => { v.nit = ev.target.checked; canvia(q, 'llista', e.llista); pintaPrincipal(); } }), icona('nit'), 'nit')));
    }
    if (!llista.children.length) llista.append(h('p', { class: 'buit' }, 'Quan tingueu el viatge, hi apareixeran les ciutats on baixeu.'));
    fila.append(llista);
  }
  caixa.append(fila);
  return caixa;
}

/** converteix les entrades del formulari en respostes normalitzades (vegeu agencia.respostaCorrecta) */
function normalitza(pq, r) {
  const out = {};
  for (const q of pq) {
    const tipus = q.valor.split(':')[0];
    const e = S.esb.entrades[q.valor] || {};
    const minuts = () => {
      const hh = nombre(e.h) ?? 0, mm = nombre(e.m) ?? 0;
      return (e.h ?? '') === '' && (e.m ?? '') === '' ? null : hh * 60 + mm;
    };
    if (tipus === 'sortida' || tipus === 'arribada') {
      const t = llegeixHora(e.hora);
      const dia = maxDia(r) > 1 ? nombre(e.dia) : 1;
      out[q.valor] = t == null || !dia ? null : (dia - 1) * S.D.regles.dia + t;
    } else if (tipus === 'total' || tipus === 'saldo') out[q.valor] = nombre(e.n);
    else if (tipus === 'espera' || tipus === 'estada') out[q.valor] = minuts();
    else if (tipus === 'diferencia_hora') out[q.valor] = { n: minuts() ?? 0, dir: e.dir || '' };
    else if (tipus === 'diferencia_euros' || tipus === 'percentatge') out[q.valor] = { n: nombre(e.n) ?? 0, dir: e.dir || '' };
    else if (tipus === 'estades') {
      out[q.valor] = (e.llista || []).slice(0, Math.max(0, S.esb.bitllets.length - 1))
        .map((v) => (v.nit ? 'nit' : (nombre(v.h) ?? 0) * 60 + (nombre(v.m) ?? 0)));
    }
  }
  return out;
}

/* ---------------------------------------------------------------- comprovació i lliurament */
function zonaResultat(r, doc) {
  const zona = h('div', { class: 'zona-resultat' });
  const res = S.resultat;
  const ctx = { nom: nomEst, bitllets: S.esb.bitllets, horaText };
  if (res?.errors?.length) {
    zona.append(h('div', { class: 'resultat malament', role: 'alert' },
      h('p', { class: 'resultat-titol' }, icona('creu'), res.titol || 'Encara no és correcte'),
      h('ul', {}, res.errors.slice(0, 3).map((e) => h('li', {}, textError(e, ctx))))));
  } else if (res?.missatge) {
    zona.append(h('div', { class: `resultat ${res.ok ? 'be' : 'malament'}`, role: 'status' },
      h('p', { class: 'resultat-titol' }, icona(res.ok ? 'check' : 'creu'), res.missatge),
      res.pendents?.length ? h('div', { class: 'pendents' }, h('p', {}, res.seguent),
        h('ul', {}, res.pendents.slice(0, 2).map((e) => h('li', {}, textError(e, ctx))))) : null));
  }
  const botons = h('div', { class: 'fila-botons' });
  botons.append(h('button', { class: 'boto primari gran', onclick: () => comprova(r), disabled: !S.esb.bitllets.length }, icona('check'), TEXTOS.botons.comprova));
  const pot = potLliurar(r, doc);
  if (pot) botons.append(h('button', { class: 'boto lliura', onclick: () => { S.confirma = true; pintaPrincipal(); } }, icona('copa'), TEXTOS.botons.lliura));
  const seg = S.AG.ORDRE[S.AG.ORDRE.indexOf(r.codi) + 1];
  if (pot && seg && S.AG.estatReptes(S.tanda, S.progres)[seg] === 'obert') {
    botons.append(h('button', { class: 'boto', title: 'Podeu tornar a aquest encàrrec mentre no el lliureu',
      onclick: async () => { await desaEsborrany(); S.actiu = seg; obreRepte(seg); pinta(); } }, 'Encàrrec següent', icona('fletxa')));
  }
  zona.append(botons);
  if (S.confirma && pot) {
    const pts = S.AG.puntsRepte(r.codi, S.progres, ajudes()).punts;
    zona.append(h('div', { class: 'confirma' },
      h('p', {}, `Lliureu l'encàrrec amb ${punts(pts)} punts? Després ja no el podreu canviar.`),
      h('div', { class: 'fila-botons' },
        h('button', { class: 'boto', onclick: () => { S.confirma = false; pintaPrincipal(); } }, 'Encara no'),
        h('button', { class: 'boto lliura', onclick: () => lliura(r) }, 'Sí, lliura\'l'))));
  }
  return zona;
}

function potLliurar(r, doc) {
  return S.AG.puntsRepte(r.codi, S.progres, ajudes()).nivell >= 1 && doc.estat !== 'lliurat';
}

async function comprova(r) {
  const doc = S.progres[r.codi] || {};
  S.esb.intents += 1;
  S.confirma = false;
  const nivellIntent = r.modalitat === 'escala' ? S.esb.nivell : 0;
  const bitllets = S.esb.bitllets;
  const refs = S.AG.referencies(S.progres);
  const pq = preguntesActuals(r);
  const respostes = normalitza(pq, r);
  let errors = [], registre = null, extra = {}, festa = null;
  if (r.modalitat === 'escala') {
    const n = nivellActual(r);
    const [errs, der] = S.A.avaluaNivell(n, bitllets);
    errors = errs;
    if (!errs.length) {
      const c = S.AG.corregeix(pq, der, respostes, refs);
      if (c.totes) {
        registre = { bitllets: bitllets.map(codificaBitllet), respostes, intents: S.esb.intents, ms: Date.now() };
        const nivells = { ...(doc.nivells || {}), [n.nivell]: registre };
        const seguent = r.nivells.find((x) => x.nivell === n.nivell + 1);
        const nom = TEXTOS.nivells[n.nivell - 1];
        S.resultat = { ok: true, missatge: `Nivell ${nom} aconseguit: +${n.punts} punts.` };
        extra = { nivells };
        S.esb = { ...S.esb, nivell: seguent ? seguent.nivell : n.nivell, bitllets: seguent ? [] : bitllets, entrades: seguent ? {} : S.esb.entrades, intents: 0 };
        if (seguent) S.resultat.missatge += ` Ara podeu provar el nivell ${TEXTOS.nivells[seguent.nivell - 1]}.`;
        S.vista = { estacio: 'B', dia: 1, tren: null };
        festa = { titol: `Nivell ${nom} aconseguit!`, pts: n.punts, seguent: seguent ? TEXTOS.nivells[seguent.nivell - 1] : null };
      } else {
        S.resultat = { ok: false, missatge: 'El viatge és correcte. Reviseu les respostes marcades.', correctes: c.correctes };
      }
    } else {
      S.resultat = { errors };
    }
  } else {
    const tall = r.codi === 'R9' ? doc.tall : null;
    const [assolit, pendents] = S.A.nivellMillora(r, bitllets, tall);
    const [, der] = S.A.avalua(bitllets, S.A.condicions(r.nivells[0].viatge), tall);
    errors = assolit ? [] : pendents;
    if (!assolit) S.resultat = { errors };
    else {
      const c = S.AG.corregeix(pq, der, respostes, refs);
      const nom = TEXTOS.nivells[assolit - 1];
      const seg = r.nivells.find((x) => x.nivell === assolit + 1);
      if (c.totes) {
        const millor = doc.millor ? S.A.nivellMillora(r, descodifica(doc.millor.bitllets), tall)[0] : 0;
        if (assolit >= millor) {
          registre = { bitllets: bitllets.map(codificaBitllet), respostes, nivell: assolit, intents: S.esb.intents, ms: Date.now() };
          extra = { millor: registre };
        }
        if (assolit > millor) {
          const pts = r.nivells.filter((x) => x.nivell > millor && x.nivell <= assolit).reduce((a, x) => a + x.punts, 0);
          festa = { titol: `El viatge arriba al nivell ${nom}!`, pts, millora: true, seguent: seg ? TEXTOS.nivells[seg.nivell - 1] : null, pendents: seg ? pendents : [] };
        }
        S.resultat = { ok: true, missatge: `El viatge arriba al nivell ${nom}.`, pendents: seg ? pendents : [], seguent: seg ? `Per arribar al nivell ${TEXTOS.nivells[seg.nivell - 1]}:` : '', correctes: c.correctes };
      } else {
        S.resultat = { ok: false, missatge: `El viatge arriba al nivell ${nom}. Reviseu les respostes marcades.`, correctes: c.correctes };
      }
    }
  }
  S.M.add(`tandes/${S.acces.tandaId}/grups/${S.acces.grupId}/intents`, {
    repte: r.codi, nivell: nivellIntent,
    bitllets: bitllets.map(codificaBitllet), respostes, errors: errors.map((e) => e.join(':')),
    resultat: registre ? 'correcte' : 'errors', uid: S.M.uid(), ms: Date.now()
  }).catch(() => {});
  await desaEsborrany(extra);
  pintaPrincipal();
  if (festa) celebraNivell(r, festa, extra);
}

/** finestra de celebració amb el pas següent ben clar */
function celebraNivell(r, f, extra) {
  const progres = { ...S.progres, [r.codi]: { ...(S.progres[r.codi] || {}), ...extra } };
  const seg = S.AG.ORDRE[S.AG.ORDRE.indexOf(r.codi) + 1];
  const segObert = seg && S.AG.estatReptes(S.tanda, progres)[seg] === 'obert';
  const vesSeguent = () => { tancaModal(); S.actiu = seg; obreRepte(seg); pinta(); };
  const lliuraAra = () => { tancaModal(); S.confirma = true; pintaPrincipal(); };
  const botons = [];
  let text;
  if (f.millora) {
    text = f.seguent ? 'Encara el podeu millorar.' : 'Viatge perfecte! Ja el podeu lliurar.';
    botons.push(h('button', { class: 'boto primari gran', onclick: tancaModal, autofocus: true }, f.seguent ? 'Continueu millorant' : 'D\'acord'));
    botons.push(h('button', { class: 'boto lliura gran', onclick: lliuraAra }, icona('copa'), TEXTOS.botons.lliura));
  } else if (f.seguent) {
    text = `Ara podeu provar el nivell ${f.seguent}${segObert ? ' o passar a l\'encàrrec següent' : ''}.`;
    botons.push(h('button', { class: 'boto primari gran', onclick: tancaModal, autofocus: true }, `Proveu el nivell ${f.seguent}`));
    if (segObert) botons.push(h('button', { class: 'boto gran', onclick: vesSeguent }, 'Encàrrec següent', icona('fletxa')));
  } else {
    text = 'Heu fet els tres nivells. Ja podeu lliurar l\'encàrrec.';
    botons.push(h('button', { class: 'boto lliura gran', onclick: lliuraAra, autofocus: true }, icona('copa'), TEXTOS.botons.lliura));
    if (segObert) botons.push(h('button', { class: 'boto gran', onclick: vesSeguent }, 'Encàrrec següent', icona('fletxa')));
  }
  const ctx = { nom: nomEst, bitllets: S.esb.bitllets, horaText };
  const pendents = f.pendents?.length ? h('div', { class: 'pendents' }, h('p', {}, h('strong', {}, `Per arribar al nivell ${f.seguent}:`)),
    h('ul', {}, f.pendents.slice(0, 2).map((e) => h('li', {}, textError(e, ctx))))) : null;
  celebra({ titol: f.titol, pts: f.pts, text, pendents, botons });
}

async function lliura(r) {
  const doc = S.progres[r.codi] || {};
  const { punts: pts, nivell, base } = S.AG.puntsRepte(r.codi, S.progres, ajudes());
  const nou = { ...doc, codi: r.codi, estat: 'lliurat', nivellAssolit: nivell, punts: base, lliuratMs: Date.now(), esborrany: esborranyDesable() };
  delete nou.id;
  await S.M.set(camiRepte(r.codi), nou);
  S.confirma = false;
  S.actiu = null;
  avis(`Encàrrec lliurat: ${punts(pts)} punts`, 'ok');
}

/* ---------------------------------------------------------------- repte lliurat */
function columnaLliurat(r, doc) {
  const col = h('section', { class: 'col col-lliurat', 'aria-label': 'Encàrrec lliurat' });
  const { punts: pts } = S.AG.puntsRepte(r.codi, S.progres, ajudes());
  const seg = S.AG.ORDRE[S.AG.ORDRE.indexOf(r.codi) + 1];
  const segObert = seg && S.AG.estatReptes(S.tanda, S.progres)[seg] === 'obert';
  col.append(h('div', { class: 'segell' }, icona('copa', 'gran'),
    h('div', {}, h('h2', {}, 'Encàrrec lliurat'), h('p', { class: 'segell-punts' }, `${punts(pts)} punts de reputació`)),
    segObert ? h('button', { class: 'boto primari gran', onclick: () => { S.actiu = seg; obreRepte(seg); pinta(); } }, 'Encàrrec següent', icona('fletxa')) : null));
  if (r.modalitat === 'escala') {
    for (const n of r.nivells) {
      const reg = doc.nivells?.[n.nivell];
      if (reg) col.append(h('h3', {}, TEXTOS.nivells[n.nivell - 1]), llistaBitllets(descodifica(reg.bitllets), { fix: true }));
    }
  } else if (doc.millor) col.append(llistaBitllets(descodifica(doc.millor.bitllets), { fix: true }));
  return col;
}

inicia();
