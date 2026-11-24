/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Lògica de l'agència: tandes, grups, progrés dels reptes i punts.
   La comparteixen l'app de l'alumnat i el panell docent.
   A Firestore no hi pot haver llistes dins de llistes: cada bitllet es desa com a text «dia|tren|de|a». */
import { idAleatori } from './magatzem.js';
import { LIMITS } from './config.js';

export const codificaBitllet = (b) => b.join('|');
export const descodificaBitllet = (s) => {
  const [d, t, de, a] = s.split('|');
  return [Number(d), t, de, a];
};
export const descodifica = (llista) => (llista || []).map(descodificaBitllet);

const ABC_CODI = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function codiAleatori() {
  const arr = new Uint32Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr, (x) => ABC_CODI[x % ABC_CODI.length]).join('');
}

function pinAleatori() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(1000 + (arr[0] % 9000));
}

export function creaAgencia(M, D, A) {
  const REPTES = D.reptes.reptes;
  const R = Object.fromEntries(REPTES.map((r) => [r.codi, r]));
  const BLOC = {};
  for (const b of D.reptes.blocs) for (const c of b.reptes) BLOC[c] = b.bloc;
  const ORDRE = REPTES.map((r) => r.codi);

  /* ---------------------------------------------------------- tandes i grups */
  async function creaTanda({ nom, noms }) {
    const uid = M.uid();
    const ara = Date.now();
    const expiraMs = ara + LIMITS.DIES_CADUCITAT * 86400000;
    const tandaId = idAleatori(20);
    let codi = null;
    for (let i = 0; i < 20 && !codi; i++) {
      const c = codiAleatori();
      const ja = await M.get(`codis/${c}`).catch(() => null);
      if (!ja || ja.expiraMs < ara) codi = c;
    }
    if (!codi) throw new Error('SENSE_CODI');
    const grups = noms.map((n, i) => ({ id: `g${i + 1}`, nom: n }));
    await M.set(`tandes/${tandaId}`, {
      propietariUid: uid, nom, codi, grups, blocObert: 1, avisViaTallada: false,
      estat: 'preparacio', versioDades: D.versio, creadaMs: ara, expiraMs
    });
    const pins = {};
    for (const [i, g] of grups.entries()) {
      pins[g.id] = pinAleatori();
      await M.set(`tandes/${tandaId}/claus/${g.id}`, { pin: pins[g.id] });
      await M.set(`tandes/${tandaId}/grups/${g.id}`, {
        nom: g.nom, ordre: i, testimoni: null, repteActual: 'R1', punts: 0, nivells: {}, darreraActivitatMs: 0
      });
    }
    await M.set(`codis/${codi}`, { tandaId, expiraMs });
    return { tandaId, codi, pins };
  }

  async function tandaDelCodi(codi) {
    const c = await M.get(`codis/${codi.toUpperCase()}`);
    if (!c || c.expiraMs < Date.now()) return null;
    const t = await M.get(`tandes/${c.tandaId}`);
    return t ? { tandaId: c.tandaId, ...t } : null;
  }

  async function entra(tandaId, grupId, pin) {
    const uid = M.uid();
    if (M.mode === 'local') {
      const clau = await M.get(`tandes/${tandaId}/claus/${grupId}`);
      if (!clau || clau.pin !== pin) throw new Error('PIN');
    }
    const cami = `tandes/${tandaId}/grups/${grupId}/membres/${uid}`;
    try {
      // Les regles no deixen modificar l'entrada d'un aparell: si ja hi havia entrat (per exemple,
      // després de «Surt»), s'esborra i es torna a crear, i les regles tornen a comprovar el PIN.
      if (M.mode !== 'local' && await M.get(cami).catch(() => null)) await M.remove(cami);
      await M.set(cami, { pin, entratMs: Date.now() });
    } catch (e) {
      throw new Error(/permission/i.test(String(e?.code || e?.message)) ? 'PIN' : 'XARXA');
    }
  }

  async function esMembre(tandaId, grupId) {
    try {
      return !!(await M.get(`tandes/${tandaId}/grups/${grupId}/membres/${M.uid()}`));
    } catch (_) {
      return false;
    }
  }

  /* ---------------------------------------------------------- respostes */
  // valor desat de cada tipus de resposta: hora i minuts en minuts absoluts; euros en euros;
  // diferències i percentatges com a {n, dir}; estades com a llista (minuts o 'nit') per parada.
  function respostaCorrecta(pregunta, resposta, correcte) {
    if (resposta == null || correcte == null) return false;
    const tipus = pregunta.valor.split(':')[0];
    if (tipus === 'estades') {
      if (!Array.isArray(resposta) || resposta.length !== correcte.length) return false;
      return correcte.every(([, v], i) => (v === 'nit' ? resposta[i] === 'nit' : Number(resposta[i]) === v));
    }
    if (['diferencia_euros', 'diferencia_hora', 'percentatge'].includes(tipus)) {
      const [n, dir] = correcte;
      const marge = tipus === 'percentatge' ? 1 : 0;
      if (n === 0) return resposta.dir === 'igual' || Number(resposta.n) === 0;
      return resposta.dir === dir && Math.abs(Number(resposta.n) - n) <= marge;
    }
    return Number(resposta) === correcte;
  }

  const derDe = (bitllets) => (bitllets && bitllets.length ? A.avalua(descodifica(bitllets), { origen: 'B' })[1] : null);

  /** viatges de referència per a les preguntes comparatives, a partir del progrés del grup */
  function referencies(progres) {
    const refs = {};
    for (const [codi, n] of [['R2', '1'], ['R3', '2'], ['R4', '1']]) {
      const b = progres[codi]?.nivells?.[n]?.bitllets;
      if (b) refs[`${codi}.${n}`] = derDe(b);
    }
    const r7 = viatgeOriginal(progres);
    if (r7) refs.R7 = derDe(r7.bitllets);
    return refs;
  }

  /** viatge del repte 7 (lliurat) que serveix d'original per al repte 8 i per a la via tallada */
  function viatgeOriginal(progres) {
    const b = progres.R7?.estat === 'lliurat' ? progres.R7?.millor?.bitllets : null;
    if (progres.R9?.tall?.origen === 'B-01') return { bitllets: D.testimonis['B-01'].map(codificaBitllet), origen: 'B-01' };
    if (b && b.length >= 2) return { bitllets: b, origen: 'R7' };
    return null;
  }

  /** tall de la via per al repte 9 a partir del viatge original (o del testimoni B-01) */
  function calculaTall(progres) {
    let orig = viatgeOriginal(progres);
    if (!orig || orig.origen !== 'R7') orig = { bitllets: D.testimonis['B-01'].map(codificaBitllet), origen: 'B-01' };
    const viatge = descodifica(orig.bitllets);
    const t = A.tallDe(viatge);
    if (!t) return null;
    const minim = D.reparacions[A.clauReparacio(t.primer, t)] ?? null;
    return { dia: t.dia, tram: t.tram, primer: t.primer, estacio: t.estacio, arribada: t.arribada, minim, origen: orig.origen };
  }

  /** corregeix totes les preguntes; retorna {valors, correctes, totes} */
  function corregeix(preguntes, der, respostes, refs) {
    const valors = {}, correctes = {};
    for (const q of preguntes) {
      valors[q.valor] = A.valor(q, der, refs);
      correctes[q.valor] = respostaCorrecta(q, respostes?.[q.valor], valors[q.valor]);
    }
    return { valors, correctes, totes: preguntes.every((q) => correctes[q.valor]) };
  }

  const preguntesDe = (repte, nivell) => repte.preguntes || nivell?.preguntes || [];

  /* ---------------------------------------------------------- punts */
  /** recalcula els punts d'un repte a partir dels bitllets i les respostes desats */
  function puntsRepte(codi, progres, ajudes = []) {
    const r = R[codi], doc = progres[codi];
    if (!doc) return { punts: 0, nivell: 0, coherent: true };
    const refs = referencies(progres);
    const factor = (n) => (ajudes.includes(`${codi}.${n}`) ? D.reptes.punts.amb_ajuda : 1);
    let punts = 0, nivell = 0, base = 0;
    if (r.modalitat === 'escala') {
      for (const n of r.nivells) {
        const reg = doc.nivells?.[n.nivell];
        if (!reg) break;
        const [errs, der] = A.avaluaNivell(n, descodifica(reg.bitllets));
        if (errs.length || !corregeix(preguntesDe(r, n), der, reg.respostes, refs).totes) break;
        punts += n.punts * factor(n.nivell);
        base += n.punts;
        nivell = n.nivell;
      }
    } else if (doc.millor) {
      const tall = codi === 'R9' ? doc.tall : null;
      const bitllets = descodifica(doc.millor.bitllets);
      const [assolit] = A.nivellMillora(r, bitllets, tall);
      const [, der] = A.avalua(bitllets, A.condicions(r.nivells[0].viatge), tall);
      if (assolit && der && corregeix(r.preguntes, der, doc.millor.respostes, refs).totes) {
        for (const n of r.nivells) {
          if (n.nivell <= assolit) { punts += n.punts * factor(n.nivell); base += n.punts; }
        }
        nivell = assolit;
      }
    }
    // el grup desa els punts sense ajudes; si no coincideixen amb el recàlcul, el panell avisa
    const coherent = (doc.punts ?? 0) === base;
    return { punts, nivell, base, coherent };
  }

  function puntsGrup(progres, ajudes = []) {
    let total = 0, coherent = true;
    const perRepte = {};
    for (const c of ORDRE) {
      const p = puntsRepte(c, progres, ajudes);
      perRepte[c] = p;
      total += p.punts;
      coherent = coherent && p.coherent;
    }
    return { total, perRepte, coherent, nota: Math.round(total / 100) / 10 };
  }

  /** estat de cada repte per a un grup: bloquejat, obert o lliurat.
      Un repte s'obre quan l'anterior té el nivell Regional (o està lliurat) i el docent n'ha obert el bloc.
      R8 necessita R7 lliurat, perquè s'hi compara; R9 s'obre amb l'avís de via tallada. */
  function estatReptes(tanda, progres) {
    const out = {};
    for (const [i, c] of ORDRE.entries()) {
      const doc = progres[c];
      if (doc?.estat === 'lliurat') { out[c] = 'lliurat'; continue; }
      const blocOk = BLOC[c] <= (tanda?.blocObert ?? 1);
      const ant = ORDRE[i - 1];
      let anteriorOk = i === 0 || progres[ant]?.estat === 'lliurat'
        || (c !== 'R8' && puntsRepte(ant, progres).nivell >= 1);
      if (c === 'R9') anteriorOk = !!tanda?.avisViaTallada;
      out[c] = blocOk && anteriorOk ? 'obert' : 'bloquejat';
    }
    return out;
  }

  return {
    R, BLOC, ORDRE, creaTanda, tandaDelCodi, entra, esMembre,
    respostaCorrecta, referencies, viatgeOriginal, calculaTall, corregeix, preguntesDe,
    puntsRepte, puntsGrup, estatReptes
  };
}
