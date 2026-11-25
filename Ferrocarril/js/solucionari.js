/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Porta del panell docent i solucionari.
   La primera vegada en cada aparell, el panell demana la contrasenya del panell. Amb aquesta contrasenya
   es desxifra dades/solucionari.xifrat.json (vegeu js/xifratge.js); si funciona, la clau es guarda a
   l'aparell i ja no es torna a demanar. El solucionari s'obre a pantalla completa des del panell. */
import { STORAGE_KEYS } from './config.js';
import { clauDe, desxifra, exportaClau, importaClau, xifra } from './xifratge.js';
import { h, icona, euros } from './ui.js';

const FITXER = 'dades/solucionari.xifrat.json';

async function fitxer() {
  const r = await fetch(FITXER, { cache: 'no-cache' });
  if (!r.ok) throw new Error('XARXA');
  return r.json();
}

/** solucionari amb la clau guardada en aquest aparell (o null si no n'hi ha o ja no serveix) */
export async function solucionariDesat() {
  const desada = localStorage.getItem(STORAGE_KEYS.CLAU_PANELL);
  if (!desada) return null;
  try {
    return JSON.parse(await desxifra(await fitxer(), await importaClau(desada)));
  } catch (e) {
    if (e.message === 'XARXA') throw e;
    localStorage.removeItem(STORAGE_KEYS.CLAU_PANELL); // la contrasenya ha canviat
    return null;
  }
}

/** comprova la contrasenya; si és bona, guarda la clau a l'aparell i retorna el solucionari */
export async function entraAlPanell(contrasenya) {
  const obj = await fitxer();
  const clau = await clauDe(obj, contrasenya);
  let text;
  try { text = await desxifra(obj, clau); } catch (_) { throw new Error('CLAU'); }
  localStorage.setItem(STORAGE_KEYS.CLAU_PANELL, await exportaClau(clau));
  return JSON.parse(text);
}

export const oblidaAparell = () => localStorage.removeItem(STORAGE_KEYS.CLAU_PANELL);

/** Canvi de contrasenya sense eines: el navegador torna a xifrar el solucionari amb la contrasenya nova
    i el baixa; el docent el puja a la carpeta dades del seu repositori i, des d'aleshores, val la nova. */
export function canviaContrasenya() {
  const camp = (id, etiqueta) => [h('label', { class: 'etiqueta', for: id }, etiqueta),
    h('input', { id, type: 'password', autocomplete: 'new-password', maxlength: 60 })];
  const [e1, nova] = camp('panell-nova', 'Contrasenya nova (6 caràcters com a mínim)');
  const [e2, repeteix] = camp('panell-repeteix', 'Repetiu-la');
  const err = h('p', { class: 'missatge-error', role: 'alert' });
  const boto = h('button', { class: 'boto primari', type: 'submit' }, icona('baixa'), 'Baixa el fitxer nou');
  const tanca = () => capa.remove();
  const envia = async (e) => {
    e.preventDefault();
    err.textContent = '';
    if (nova.value.trim().length < 6) { err.textContent = 'Ha de tenir 6 caràcters com a mínim.'; return; }
    if (nova.value !== repeteix.value) { err.textContent = 'Les dues contrasenyes no són iguals.'; return; }
    boto.disabled = true;
    try {
      const obj = await fitxer();
      const text = await desxifra(obj, await importaClau(localStorage.getItem(STORAGE_KEYS.CLAU_PANELL)));
      const nou = await xifra(text, nova.value, obj.empremta ?? null);
      const a = h('a', { href: URL.createObjectURL(new Blob([JSON.stringify(nou)], { type: 'application/json' })),
        download: 'solucionari.xifrat.json' });
      document.body.append(a); a.click(); a.remove();
      form.replaceChildren(
        h('h2', {}, icona('check'), 'Fitxer baixat'),
        h('p', {}, 'La contrasenya nova encara no funciona. Per activar-la:'),
        h('ol', { class: 'passos-canvi' },
          h('li', {}, 'Al vostre repositori de GitHub, obriu la carpeta ', h('b', {}, 'dades'), '.'),
          h('li', {}, 'Toqueu ', h('b', {}, 'Add file › Upload files'), ' i deixeu-hi el fitxer ', h('b', {}, 'solucionari.xifrat.json'), ' que acabeu de baixar. Substitueix l\'anterior.'),
          h('li', {}, 'Toqueu ', h('b', {}, 'Commit changes'), '. Al cap d\'uns minuts, cada aparell demanarà una vegada la contrasenya nova.')),
        h('button', { class: 'boto', type: 'button', onclick: tanca }, 'Entesos'));
    } catch (_) {
      err.textContent = 'No s\'ha pogut preparar el fitxer. Torneu a entrar al panell i proveu-ho de nou.';
      boto.disabled = false;
    }
  };
  const form = h('form', { class: 'targeta porta-targeta canvi-clau', onsubmit: envia },
    h('button', { type: 'button', class: 'boto-icona tanca', 'aria-label': 'Tanca', onclick: tanca }, icona('creu')),
    h('span', { class: 'porta-icona', 'aria-hidden': 'true' }, icona('cadenat')),
    h('h2', {}, 'Contrasenya del panell'),
    h('p', { class: 'nota' }, 'Per a les còpies de l\'app d\'altres escoles. L\'app no la desa enlloc: baixareu el solucionari xifrat amb la contrasenya nova i l\'haureu de pujar al vostre repositori.'),
    e1, nova, e2, repeteix, err, boto);
  const capa = h('div', { class: 'capa-sol capa-canvi', onclick: (e) => { if (e.target === capa) tanca(); } }, form);
  document.body.append(capa);
  setTimeout(() => nova.focus(), 50);
}

/** pantalla de la porta: es resol amb el solucionari quan la contrasenya és bona */
export function porta(main) {
  return new Promise((resol) => {
    const input = h('input', { id: 'clau-panell', type: 'password', autocomplete: 'current-password', maxlength: 60 });
    const veure = h('button', { type: 'button', class: 'boto-icona veure', 'aria-label': 'Mostra la contrasenya',
      onclick: () => { input.type = input.type === 'password' ? 'text' : 'password'; } }, icona('ull'));
    const err = h('p', { class: 'missatge-error', role: 'alert' });
    const boto = h('button', { class: 'boto primari gran', type: 'submit' }, 'Entra', icona('fletxa'));
    const envia = async (e) => {
      e.preventDefault();
      err.textContent = ''; boto.disabled = true;
      try { resol(await entraAlPanell(input.value)); } catch (x) {
        err.textContent = x.message === 'CLAU' ? 'La contrasenya no és correcta.' : 'No hi ha connexió. Torneu-ho a provar.';
        boto.disabled = false; input.select();
      }
    };
    main.replaceChildren(h('div', { class: 'porta' },
      h('form', { class: 'targeta porta-targeta', onsubmit: envia },
        h('span', { class: 'porta-icona', 'aria-hidden': 'true' }, icona('cadenat')),
        h('h1', {}, 'Panell del professorat'),
        h('p', { class: 'nota' }, 'Primera vegada en aquest aparell. Després ja no us la demanarà.'),
        h('label', { class: 'etiqueta', for: 'clau-panell' }, 'Contrasenya del panell'),
        h('div', { class: 'camp-clau' }, input, veure),
        err, boto,
        h('a', { class: 'porta-alumnat', href: './' }, icona('tren', 'mini'), 'Sou alumnes? Aneu a l\'app'))));
    setTimeout(() => input.focus(), 50);
  });
}

/* ================================================================ vista del solucionari */
const negreta = (txt) => String(txt ?? '').split(/\*\*(.+?)\*\*/g).map((t, i) => (i % 2 ? h('strong', {}, t) : t));
const color = (bloc) => `--bloc: var(--b${bloc})`;

function bitllets(viatge) {
  return h('ol', { class: 'sol-bitllets' }, viatge.map((b) => h('li', {},
    h('span', { class: 'sol-dia' }, `Dia ${b.dia}`),
    h('span', { class: 'sol-trajecte' },
      h('b', {}, b.surt), ` ${b.de}`, h('span', { class: 'sol-fletxa', 'aria-hidden': 'true' }, icona('fletxa')),
      h('b', {}, b.arriba), ` ${b.a}`),
    h('span', { class: 'sol-preu' }, euros(b.preu)),
    h('span', { class: 'sol-tren', title: 'Codi del tren (només per al docent)' }, b.tren))));
}

function respostes(llista, nota = 'Depèn de cada grup') {
  if (!llista?.length) return null;
  return h('dl', { class: 'sol-respostes' }, llista.flatMap((q) => {
    const llarg = (q.valor ?? '').length > 22 ? 'llarg' : '';
    return [h('dt', { class: llarg }, q.text),
      h('dd', { class: q.valor == null ? 'depen' : llarg }, llarg ? q.valor.split(' · ').map((x) => h('span', {}, x)) : (q.valor ?? nota))];
  }));
}

function targetaNivell(n, anterior) {
  const mateix = n.ref && anterior?.ref === n.ref;
  return h('article', { class: `sol-nivell n${n.nivell}` },
    h('header', {}, h('span', { class: 'sol-nivell-nom' }, n.nom), h('span', { class: 'sol-nivell-punts' }, `${n.punts} punts`)),
    h('p', { class: 'sol-peticio' }, n.enunciat.replace('[PREU]', '…')),
    n.viatge ? h('div', { class: 'sol-bloc' },
      h('p', { class: 'sol-etiqueta' }, icona('bitllet', 'mini'), n.ref ? `Viatge de referència ${n.ref}` : 'Viatge'),
      mateix ? h('p', { class: 'sol-mateix' }, `El mateix viatge del nivell ${anterior.nom}.`) : bitllets(n.viatge)) : null,
    n.respostes?.length && !mateix ? h('div', { class: 'sol-bloc' },
      h('p', { class: 'sol-etiqueta' }, icona('calculadora', 'mini'), 'Respostes'), respostes(n.respostes)) : null,
    n.clau ? h('div', { class: 'sol-clau' }, icona('ma', 'mini'), h('p', {}, negreta(n.clau))) : null,
    n.valids > 1 ? h('p', { class: 'sol-opcions' }, `${n.valids} viatges vàlids: aquest n'és un.`) : null);
}

function vistaRepte(r, ctx) {
  const cos = h('div', { class: 'sol-repte', style: color(r.bloc) },
    h('div', { class: 'sol-client' },
      h('span', { class: 'client-icona', 'aria-hidden': 'true' }, r.client.replace(/^(La |El |L'|En |Na )?(família )?/i, '').slice(0, 1)),
      h('div', {}, h('p', { class: 'client-nom' }, `${r.codi} · ${r.client}`), h('h3', {}, r.titol), h('p', { class: 'sol-encarrec' }, r.encarrec))),
    r.enunciat ? h('p', { class: 'sol-missio' }, r.enunciat) : null,
    h('div', { class: 'sol-nivells' }, r.nivells.map((n, i) => targetaNivell(n, r.nivells[i - 1]))));
  if (r.codi === 'R9') cos.append(viaTalladaGrups(ctx));
  return cos;
}

/* ---------------------------------------------------------------- via tallada: un cas per grup */
const dos = (n) => String(n).padStart(2, '0');
const durada = (m) => { const h_ = Math.floor(m / 60), r = m % 60; return h_ && r ? `${h_} h ${dos(r)} min` : (h_ ? `${h_} h` : `${r} min`); };
function horaTxt(t, DAY) { const d = Math.floor(t / DAY) + 1, m = t % DAY; const hh = `${dos(Math.floor(m / 60))}.${dos(m % 60)}`; return d === 1 ? hh : `dia ${d}, ${hh}`; }
const DIR = { mes_car: 'més car', mes_barat: 'més barat', despres: 'més tard', abans: 'més aviat', puja: 'més car', baixa: 'més barat' };

function respostesR9(ctx, repte, b, refs) {
  const [, der] = ctx.A.avalua(b, { origen: 'B' });
  if (!der) return [];
  return repte.preguntes.map((q) => {
    const v = ctx.A.valor(q, der, refs);
    const tipus = q.valor.split(':')[0];
    let txt = null;
    if (v != null) {
      if (tipus === 'total') txt = euros(v);
      else if (tipus === 'arribada') txt = horaTxt(v, ctx.A.DAY);
      else if (v[1] === 'igual') txt = 'igual';
      else if (tipus === 'diferencia_euros') txt = `${v[0]} € ${DIR[v[1]]}`;
      else if (tipus === 'diferencia_hora') txt = `${durada(v[0])} ${DIR[v[1]]}`;
      else if (tipus === 'percentatge') txt = `${v[0]} % ${DIR[v[1]]}`;
    }
    return { text: q.text, valor: txt };
  });
}

function casR9(ctx, nom, progres) {
  const t = ctx.AG.calculaTall(progres);
  if (!t) return h('article', { class: 'sol-cas' }, h('h4', {}, nom), h('p', { class: 'nota' }, 'Sense dades per calcular el tall.'));
  const rep = ctx.SOL.reparacions[ctx.A.clauReparacio(t.primer, t)];
  const refs = ctx.AG.referencies({ ...progres, R9: { ...(progres.R9 || {}), tall: { origen: t.origen } } });
  const repte = ctx.D.reptes.reptes.find((r) => r.codi === 'R9');
  const tram = t.tram.map(ctx.nomEst).join(' – ');
  return h('article', { class: 'sol-cas' },
    h('header', {}, h('h4', {}, nom), h('span', { class: 'sol-origen' }, t.origen === 'R7' ? 'Parteix del seu R7' : 'Parteix de B-01 (no ha lliurat el R7)')),
    h('ul', { class: 'sol-xifres' },
      h('li', { class: 'tall' }, icona('avis', 'mini'), h('span', {}, 'Tall'), h('b', {}, `Dia ${t.dia} · ${tram}`)),
      h('li', {}, h('span', {}, 'Regional'), h('b', {}, 'Qualsevol reparació vàlida')),
      h('li', {}, h('span', {}, 'Exprés'), h('b', {}, rep ? `${rep.minim + 15} € o menys` : '—')),
      h('li', {}, h('span', {}, 'Alta velocitat'), h('b', {}, rep ? `${rep.minim} €` : '—'))),
    rep ? h('div', { class: 'sol-cas-cos' },
      h('div', { class: 'sol-bloc' }, h('p', { class: 'sol-etiqueta' }, icona('bitllet', 'mini'), 'Reparació més barata'), bitllets(rep.viatge)),
      h('div', { class: 'sol-bloc' }, h('p', { class: 'sol-etiqueta' }, icona('calculadora', 'mini'), 'Respostes amb aquesta reparació'),
        respostes(respostesR9(ctx, repte, rep.bitllets, refs)))) : null);
}

function viaTalladaGrups(ctx) {
  const grups = ctx.grups || [];
  const casos = grups.length
    ? grups.map((g) => casR9(ctx, `Grup ${g.nom}`, ctx.progres[g.id] || {}))
    : [casR9(ctx, 'Exemple: un grup que parteix de B-01', {})];
  return h('section', { class: 'sol-grups' },
    h('h3', {}, icona('avis'), grups.length ? 'Via tallada de cada grup' : 'Via tallada: un exemple'),
    h('p', { class: 'nota' }, grups.length
      ? 'Cada grup té un tall diferent. Es calcula amb el viatge que va lliurar al repte 7 i s\'actualitza sol.'
      : 'Obriu una tanda per veure el tall i la reparació de cada grup.'),
    h('div', { class: 'sol-casos' }, casos));
}

/* ---------------------------------------------------------------- altres pestanyes */
function vistaCataleg(SOL) {
  return h('div', { class: 'sol-repte', style: color(3) },
    h('div', { class: 'sol-client' }, h('span', { class: 'client-icona', 'aria-hidden': 'true' }, icona('mapa')),
      h('div', {}, h('p', { class: 'client-nom' }, 'R7 i R8 · El gran viatge'), h('h3', {}, 'Viatges de referència comprovats'),
        h('p', { class: 'sol-encarrec' }, 'Tots compleixen les regles del gran viatge. L\'alumnat en pot trobar d\'altres: l\'app els comprova igual.'))),
    h('div', { class: 'sol-cataleg' }, SOL.cataleg.map((c) => h('article', { class: 'sol-cat' },
      h('header', {}, h('b', {}, c.ref), h('span', {}, `${c.visites} ciutats`), h('span', {}, euros(c.total)), h('span', {}, `Torna ${c.retorn}`)),
      bitllets(c.viatge)))));
}

function vistaProva(SOL) {
  return h('div', { class: 'sol-repte', style: color(4) },
    h('div', { class: 'sol-client' }, h('span', { class: 'client-icona', 'aria-hidden': 'true' }, icona('check')),
      h('div', {}, h('p', { class: 'client-nom' }, 'Trobada 4 · en paper, sense l\'app'), h('h3', {}, 'Prova individual'),
        h('p', { class: 'sol-encarrec' }, 'Qualsevol de les dues tries és vàlida si es justifica. La condició al límit (arribar just a l\'hora màxima) és vàlida.'))),
    h('div', { class: 'sol-nivells' }, SOL.prova.map((p) => h('article', { class: 'sol-nivell n1' },
      h('header', {}, h('span', { class: 'sol-nivell-nom' }, p.titol), h('span', { class: 'sol-nivell-punts' }, `${p.cartera} € a la cartera`)),
      h('p', { class: 'sol-peticio' }, `Arriben a ${p.estacio} a les ${p.arribada}. Han de ser a Barcelona com a molt tard a les ${p.limit}.`),
      h('div', { class: 'sol-bloc' }, h('dl', { class: 'sol-respostes' },
        h('dt', {}, `Espera fins al tren de les ${p.trens[0].surt}`), h('dd', {}, p.espera),
        ...p.trens.flatMap((t) => [h('dt', {}, `Tren de les ${t.surt}: arribada i diners que queden`), h('dd', {}, `${t.arriba} · ${euros(t.saldo)}`)]))),
      h('div', { class: 'sol-clau' }, icona('ma', 'mini'), h('p', {},
        `El de les ${p.trens[1].surt} estalvia `, h('strong', {}, euros(p.estalvi)), ' i arriba ', h('strong', {}, p.mes_tard), ' més tard',
        p.al_limit ? ', just al límit (vàlid).' : '.'))))));
}

/** obre el solucionari a pantalla completa. ctx: {SOL, D, A, AG, grups, progres, nomEst} */
export function obreSolucionari(ctx, inicial = 'R1') {
  document.getElementById('capa-sol')?.remove();
  const pestanyes = [
    ...ctx.SOL.reptes.map((r) => ({ id: r.codi, text: r.codi, titol: r.titol, bloc: r.bloc })),
    { id: 'REF', text: 'Referències', titol: 'Gran viatge', bloc: 3, icona: 'mapa' },
    { id: 'PROVA', text: 'Prova', titol: 'Prova individual', bloc: 4, icona: 'check' }];
  let actual = inicial;
  const cos = h('div', { class: 'sol-cos' });
  const barra = h('nav', { class: 'sol-pestanyes', 'aria-label': 'Parts del solucionari' });
  const pinta = () => {
    barra.replaceChildren(...pestanyes.map((p) => h('button', {
      class: `sol-pestanya ${p.id === actual ? 'actiu' : ''}`, style: color(p.bloc), 'aria-current': p.id === actual ? 'true' : null,
      title: p.titol, onclick: () => { actual = p.id; pinta(); cos.scrollTop = 0; }
    }, p.icona ? icona(p.icona, 'mini') : null, h('b', {}, p.text), h('span', {}, p.titol))));
    const r = ctx.SOL.reptes.find((x) => x.codi === actual);
    cos.replaceChildren(r ? vistaRepte(r, ctx) : actual === 'REF' ? vistaCataleg(ctx.SOL) : vistaProva(ctx.SOL));
  };
  const tanca = () => { capa.remove(); document.removeEventListener('keydown', tecla); };
  const tecla = (e) => { if (e.key === 'Escape') tanca(); };
  const capa = h('div', { class: 'capa-sol', id: 'capa-sol', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'sol-titol' },
    h('div', { class: 'solucionari' },
      h('header', { class: 'sol-cap amb-pestanyes' },
        h('div', { class: 'sol-titol' },
          h('h2', { id: 'sol-titol' }, icona('check'), 'Solucionari'),
          h('span', { class: 'sol-avis' }, icona('cadenat', 'mini'), 'No el projecteu a classe')),
        barra,
        h('button', { class: 'boto-icona tanca', 'aria-label': 'Tanca el solucionari', onclick: tanca }, icona('creu'))),
      cos));
  document.addEventListener('keydown', tecla);
  document.body.append(capa);
  pinta();
  return { tanca };
}

