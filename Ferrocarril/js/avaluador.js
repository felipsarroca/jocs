/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Avaluador dels viatges de «Pròxima sortida».
   És una còpia exacta de Verificador/avaluador.py (la referència). Les proves
   (proves/prova-avaluador.mjs) comparen tots dos amb proves/vectors.json.
   Un bitllet és [dia, tren, de, a]. Un viatge és una llista de bitllets consecutius.
   Els errors són llistes [codi, ...dades] en l'ordre en què es mostren a l'alumnat. */

export function creaAvaluador(D) {
  const DAY = D.regles.dia, CHANGE = D.regles.canvi, VISIT = D.regles.visita;
  const SPEC = D.reptes;
  const TR = D.trens;
  const NIVELLS = {};
  for (const r of SPEC.reptes) for (const n of r.nivells) NIVELLS[`${r.codi}.${n.nivell}`] = [r, n];

  // trams físics de cada salt: HOP[tren][k] = ['A-B', ...] (parells ordenats alfabèticament)
  const HOP = {};
  for (const [c, t] of Object.entries(TR)) {
    HOP[c] = t.recorregut.map((seq) => {
      const out = [];
      for (let i = 0; i + 1 < seq.length; i++) out.push(clauTram([seq[i], seq[i + 1]]));
      return out;
    });
  }

  function clauTram(parell) {
    const [a, b] = [...parell].sort();
    return `${a}-${b}`;
  }

  const div = (a, b) => Math.floor(a / b);

  function absT(txt) {
    const [d, h] = txt.split(' ');
    return (Number(d.slice(1)) - 1) * DAY + Number(h.slice(0, 2)) * 60 + Number(h.slice(3));
  }

  function hora(t) {
    const p = (n) => String(n).padStart(2, '0');
    return `D${div(t, DAY) + 1} ${p(div(t % DAY, 60))}.${p(t % 60)}`;
  }

  function condicions(nv) {
    let c = { origen: 'B' };
    if (nv.gran_viatge) c = { ...c, ...SPEC.gran_viatge };
    for (const [k, v] of Object.entries(nv)) {
      if (k === 'visites' && 'visites' in c) c.visites = [...new Set([...c.visites, ...v])].sort();
      else if (k !== 'gran_viatge') c[k] = v;
    }
    return c;
  }

  function recorregut(bitllets) {
    const trams = [];
    for (let k = 0; k < bitllets.length; k++) {
      const [dia, tren, de, a] = bitllets[k];
      if (!(tren in TR)) return [null, ['tren', k]];
      const st = TR[tren].parades.map((p) => p[0]);
      if (!st.includes(de) || !st.includes(a) || st.indexOf(a) <= st.indexOf(de)) return [null, ['parada', k]];
      const i = st.indexOf(de), j = st.indexOf(a);
      const sortida = (dia - 1) * DAY + TR[tren].parades[i][1];
      const arribada = (dia - 1) * DAY + TR[tren].parades[j][1];
      let preu = 0;
      for (let x = i; x < j; x++) preu += TR[tren].tarifes[x];
      const segments = HOP[tren].slice(i, j).flat();
      trams.push({ dia, tren, de, a, i, j, sortida, arribada, preu, segments });
    }
    return [trams, null];
  }

  function tallDe(viatgeOriginal) {
    const [trams, err] = recorregut(viatgeOriginal);
    if (err || trams.length < 2) return null;
    const t2 = trams[1];
    const seq = TR[t2.tren].recorregut[t2.i];
    return {
      dia: t2.dia, tram: [seq[0], seq[1]].sort(), primer: [...viatgeOriginal[0]],
      estacio: t2.de, arribada: trams[0].arribada
    };
  }

  function clauReparacio(primer, tall) {
    return `${primer[1]}|${primer[3]}|${tall.dia}|${clauTram(tall.tram)}`;
  }

  function avalua(bitllets, cond, tall = null) {
    const errs = [];
    if (!bitllets || !bitllets.length) return [[['buit']], null];
    const [trams, err] = recorregut(bitllets);
    if (err) return [[err], null];
    const origen = cond.origen ?? 'B';
    if (trams[0].de !== origen) errs.push(['origen', origen]);
    if (trams[0].dia !== 1) errs.push(['primer_dia']);
    const estades = [];
    for (let k = 1; k < trams.length; k++) {
      const ant = trams[k - 1], act = trams[k];
      if (act.de !== ant.a) { errs.push(['continuitat', k]); continue; }
      const espera = act.sortida - ant.arribada;
      if (act.tren === ant.tren && act.dia === ant.dia && act.i === ant.j) errs.push(['mateix_tren', k]);
      else if (espera < CHANGE) errs.push(['canvi', k, espera]);
      if (ant.a === origen && cond.desti === origen) errs.push(['torna_abans', k]);
      const nit = div(act.sortida, DAY) !== div(ant.arribada, DAY);
      estades.push({ estacio: ant.a, minuts: espera, nit });
    }
    if (tall) {
      const b0 = bitllets[0], p = tall.primer;
      if (b0.length !== p.length || b0.some((x, i) => x !== p[i])) errs.push(['primer_fix']);
      const clau = clauTram(tall.tram);
      for (let k = 1; k < trams.length; k++) {
        if (trams[k].dia === tall.dia && trams[k].segments.includes(clau)) errs.push(['tallat', k]);
      }
    }
    const darrer = trams[trams.length - 1];
    const total = trams.reduce((s, t) => s + t.preu, 0);
    if ('desti' in cond && darrer.a !== cond.desti) errs.push(['desti', cond.desti]);
    if ('termini' in cond && darrer.arribada > absT(cond.termini)) errs.push(['termini', cond.termini]);
    if ('arribada_dia' in cond && div(darrer.arribada, DAY) + 1 !== cond.arribada_dia) errs.push(['arribada_dia', cond.arribada_dia]);
    if ('pressupost' in cond && total > cond.pressupost) errs.push(['pressupost', cond.pressupost]);
    if (tall && 'marge_reparacio' in cond && total > tall.minim + cond.marge_reparacio) {
      errs.push(['pressupost_reparacio', tall.minim + cond.marge_reparacio]);
    }
    if ('max_bitllets' in cond && trams.length > cond.max_bitllets) errs.push(['max_bitllets', cond.max_bitllets]);
    if ('min_bitllets' in cond && trams.length < cond.min_bitllets) errs.push(['min_bitllets', cond.min_bitllets]);
    const p = cond.primer;
    if (p) {
      const t0 = trams[0];
      if ('surt' in p && t0.sortida !== absT('D1 ' + p.surt)) errs.push(['primer_surt', p.surt]);
      if ('fins' in p && t0.a !== p.fins) errs.push(['primer_fins', p.fins]);
      if ('tren_cap_a' in p) {
        const par = TR[t0.tren].parades;
        if (par[par.length - 1][0] !== p.tren_cap_a) errs.push(['primer_cap_a', p.tren_cap_a]);
      }
    }
    const visites = [];
    for (const e of estades) {
      if ((e.nit || e.minuts >= VISIT) && e.estacio !== origen && !visites.includes(e.estacio)) visites.push(e.estacio);
    }
    for (const v of cond.visites || []) if (!visites.includes(v)) errs.push(['visita', v]);
    if ('min_visites' in cond && visites.length < cond.min_visites) errs.push(['min_visites', cond.min_visites]);
    if (cond.alguna_de) {
      const ok = cond.alguna_de.some((a) => (!('pressupost' in a) || total <= a.pressupost)
        && (!('termini' in a) || darrer.arribada <= absT(a.termini)));
      if (!ok) errs.push(['alguna_de']);
    }
    const der = {
      sortida: trams[0].sortida, arribada: darrer.arribada, total,
      saldo: 'pressupost' in cond ? cond.pressupost - total : null,
      estades, visites, bitllets: trams.length, trams
    };
    return [errs, der];
  }

  function estadaA(der, est, primera = false) {
    const ms = der.estades.filter((e) => e.estacio === est).map((e) => e.minuts);
    if (!ms.length) return null;
    return primera ? ms[0] : Math.max(...ms);
  }

  function valor(pregunta, der, refs) {
    const v = pregunta.valor;
    if (['sortida', 'arribada', 'total', 'saldo'].includes(v)) return der[v];
    if (v === 'estades') return der.estades.map((e) => [e.estacio, e.nit ? 'nit' : e.minuts]);
    const [tipus, arg] = v.split(':');
    if (tipus === 'espera' || tipus === 'estada') return estadaA(der, arg, tipus === 'espera');
    const ref = refs[arg];
    if (ref == null) return null;
    if (tipus === 'diferencia_euros') {
      const d = der.total - ref.total;
      return [Math.abs(d), d === 0 ? 'igual' : (d > 0 ? 'mes_car' : 'mes_barat')];
    }
    if (tipus === 'diferencia_hora') {
      const d = der.arribada - ref.arribada;
      return [Math.abs(d), d === 0 ? 'igual' : (d > 0 ? 'despres' : 'abans')];
    }
    if (tipus === 'percentatge') {
      const d = der.total - ref.total;
      const pc = div(Math.abs(d) * 200 + ref.total, 2 * ref.total); // arrodoniment escolar
      return [pc, d === 0 ? 'igual' : (d > 0 ? 'puja' : 'baixa')];
    }
    throw new Error(`pregunta desconeguda: ${v}`);
  }

  function objectiuAssolit(nivell, der) {
    const obj = nivell.objectiu, sol = nivell.solucio || {};
    if (obj === 'valid') return [true, null];
    if (obj === 'mes_barat') return [der.total === sol.total, 'mes_barat'];
    if (obj === 'arriba_abans') return [der.arribada === absT(sol.arribada), 'arriba_abans'];
    if (obj.startsWith('max_estada:')) return [estadaA(der, obj.split(':')[1]) === sol.estada, 'max_estada'];
    throw new Error(`objectiu desconegut: ${obj}`);
  }

  function avaluaNivell(nivell, bitllets, tall = null) {
    const [errs, der] = avalua(bitllets, condicions(nivell.viatge), tall);
    if (!errs.length) {
      const [ok, motiu] = objectiuAssolit(nivell, der);
      if (!ok) errs.push(['objectiu', motiu]);
    }
    return [errs, der];
  }

  function nivellMillora(repte, bitllets, tall = null) {
    let assolit = 0, pendents = [];
    for (const n of repte.nivells) {
      const [errs] = avaluaNivell(n, bitllets, tall);
      if (errs.length) { pendents = errs; break; }
      assolit = n.nivell;
    }
    return [assolit, pendents];
  }

  return {
    DAY, CHANGE, VISIT, SPEC, TR, NIVELLS, HOP,
    absT, hora, condicions, recorregut, tallDe, clauTram, clauReparacio,
    avalua, avaluaNivell, nivellMillora, estadaA, valor, objectiuAssolit
  };
}
