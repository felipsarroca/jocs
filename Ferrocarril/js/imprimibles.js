/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Imprimibles del panell docent: tots els materials en paper en una sola pantalla, agrupats per a qui són.
   Els públics es baixen de docs/; la prova individual i la carpeta docent porten les solucions i es baixen
   xifrats de dades/impresos: la clau és dins del solucionari, que només s'obre amb la contrasenya del panell. */
import { PRESENTACIO } from './config.js';
import { desxifraBytes } from './xifratge.js';
import { h, icona, avis } from './ui.js';

const M = 'docs/materials/';
const GRUPS = [
  { titol: 'Per preparar la SdA', icona: 'ajuda', peces: [
    { nom: 'Presentació per al professorat', detall: 'Què és, com es prepara i com s\'avalua', mida: 'A4 · 7 pàgines', copies: 'Per llegir', href: PRESENTACIO, fitxer: 'Presentació per al professorat.pdf' },
    { nom: 'Guia de les quatre trobades', detall: 'Què cal imprimir, minut a minut i preguntes d\'observació', mida: 'A4 · una cara', copies: '1 per docent', href: M + '06-guia-de-les-trobades.pdf', fitxer: '06 - Guia de les quatre trobades.pdf' }] },
  { titol: 'Per a cada grup', icona: 'persona', peces: [
    { nom: 'Targetes d\'accés', detall: 'Codi de la tanda, grup i PIN', mida: 'A4 · sis per full', copies: '1 full per tanda', tall: 'Per les línies discontínues', targetes: true },
    { nom: 'Mapa de la xarxa', detall: 'Amb retoladors esborrables', mida: 'A3 horitzontal · plastificat', copies: '6 + 1 de reserva', href: M + '01-mapa-de-la-xarxa-A3.pdf', fitxer: '01 - Mapa de la xarxa (A3).pdf' },
    { nom: 'Full de regles', detall: 'Regles, punts i lliurament', mida: 'A4 doble cara · plastificat', copies: '6 + 1 de reserva', href: M + '02-full-de-regles.pdf', fitxer: '02 - Full de regles.pdf' },
    { nom: 'Full de càlculs', detall: 'Per fer els càlculs a mà', mida: 'A4 doble cara', copies: '6 + 2 de reserva, per tanda', href: M + '03-full-de-calculs.pdf', fitxer: '03 - Full de càlculs.pdf' }] },
  { titol: 'Només per al docent', icona: 'cadenat', protegit: true, peces: [
    { nom: 'Prova individual', detall: 'Versions A i B, i recuperació (sense solucions)', mida: 'A4 · dues proves A5 per full', copies: 'A: 6 fulls · B: 6 fulls · recuperació: 1', tall: 'Per la línia de les tisores', id: 'prova', fitxer: '04 - Prova individual A, B i recuperació.pdf' },
    { nom: 'Carpeta docent', detall: 'Solucions, rúbrica i graella d\'observació', mida: 'A4 · una cara', copies: '1 (la graella, una per tanda)', id: 'carpeta-docent', fitxer: '05 - Carpeta docent.pdf' }] },
  { titol: 'Per si cau la connexió', icona: 'avis', peces: [
    { nom: 'Quadern de panells de reserva', detall: 'Les sortides de totes les estacions en paper', mida: 'A4 doble cara · grapat', copies: '2 en total', href: M + '07-quadern-de-panells-de-reserva.pdf', fitxer: '07 - Quadern de panells de reserva.pdf' }] }
];

function baixa(blob, nom) {
  const a = h('a', { href: URL.createObjectURL(blob), download: nom });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function baixaProtegit(SOL, p, boto) {
  const f = SOL?.impresos?.fitxers?.find((x) => x.id === p.id);
  if (!f) { avis('Aquest document encara no és al panell.', 'error'); return; }
  boto.disabled = true;
  try {
    const r = await fetch(f.fitxer, { cache: 'no-cache' });
    if (!r.ok) throw new Error('XARXA');
    baixa(new Blob([await desxifraBytes(await r.arrayBuffer(), SOL.impresos.clau)], { type: 'application/pdf' }), p.fitxer);
  } catch (_) {
    avis('No s\'ha pogut baixar. Comproveu la connexió i torneu-ho a provar.', 'error');
  } finally { boto.disabled = false; }
}

/** ctx: { SOL, targetes: funció que imprimeix les targetes de la tanda oberta, o null si no n'hi ha cap } */
export function obreImprimibles(ctx) {
  const tanca = () => { capa.remove(); document.removeEventListener('keydown', tecla); };
  const tecla = (e) => { if (e.key === 'Escape') tanca(); };
  const accio = (p) => {
    if (p.targetes) {
      return ctx.targetes
        ? h('button', { class: 'boto petit primari', onclick: () => { tanca(); ctx.targetes(); } }, icona('impressora'), 'Imprimeix')
        : h('span', { class: 'imp-nota' }, 'Obriu una tanda');
    }
    if (p.id) {
      const b = h('button', { class: 'boto petit', onclick: () => baixaProtegit(ctx.SOL, p, b) }, icona('baixa'), 'Baixa');
      return b;
    }
    return h('a', { class: 'boto petit', href: p.href, download: p.fitxer }, icona('baixa'), 'Baixa');
  };
  const peca = (p) => h('li', { class: 'imp-peca' },
    h('div', { class: 'imp-text' },
      h('strong', {}, p.nom), h('span', { class: 'imp-detall' }, p.detall),
      h('span', { class: 'imp-xips' },
        h('span', {}, icona('impressora', 'mini'), p.mida),
        h('span', {}, icona('persona', 'mini'), p.copies),
        p.tall ? h('span', { class: 'tall' }, icona('tisores', 'mini'), p.tall) : null)),
    accio(p));
  const capa = h('div', { class: 'capa-sol capa-imp', onclick: (e) => { if (e.target === capa) tanca(); } },
    h('section', { class: 'imprimibles', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'imp-titol' },
      h('header', { class: 'sol-cap' },
        h('h2', { id: 'imp-titol' }, icona('impressora'), 'Imprimibles'),
        h('span', { class: 'imp-avis' }, 'A «Mida real» (100 %) · es llegeixen bé en blanc i negre'),
        h('button', { class: 'boto-icona tanca', 'aria-label': 'Tanca', onclick: tanca }, icona('creu'))),
      h('div', { class: 'imp-cos' }, GRUPS.map((g) => h('div', { class: `imp-grup${g.protegit ? ' protegit' : ''}` },
        h('h3', {}, icona(g.icona), g.titol),
        h('ul', {}, g.peces.map(peca)))))));
  document.body.append(capa);
  document.addEventListener('keydown', tecla);
}
