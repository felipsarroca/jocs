/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Compara js/avaluador.js amb l'avaluador de referència (Verificador/avaluador.py).
   Ús: node proves/prova-avaluador.mjs
   proves/vectors.json el genera Verificador/exporta.py. */
import { readFileSync } from 'node:fs';
import { creaAvaluador } from '../js/avaluador.js';

const llegeix = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), 'utf8'));
const D = llegeix('../dades/dades.json');
const vectors = llegeix('./vectors.json');
const A = creaAvaluador(D);
const R = Object.fromEntries(D.reptes.reptes.map((r) => [r.codi, r]));

const derJson = (der) => der && ({
  sortida: der.sortida, arribada: der.arribada, total: der.total, saldo: der.saldo,
  visites: der.visites, bitllets: der.bitllets,
  estades: der.estades.map((e) => [e.estacio, e.minuts, e.nit])
});
const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let ok = 0;
const errors = [];
for (const [i, v] of vectors.entries()) {
  const r = R[v.repte];
  let errs, der, assolit;
  if (v.nivell != null) {
    const n = r.nivells.find((x) => x.nivell === v.nivell);
    [errs, der] = A.avaluaNivell(n, v.bitllets, v.tall ?? null);
  } else {
    [assolit, errs] = A.nivellMillora(r, v.bitllets, v.tall ?? null);
    [, der] = A.avalua(v.bitllets, A.condicions(r.nivells[0].viatge), v.tall ?? null);
  }
  const dif = [];
  if (!igual(errs, v.errors)) dif.push(`errors ${JSON.stringify(errs)} ≠ ${JSON.stringify(v.errors)}`);
  if (!igual(derJson(der), v.der)) dif.push('derivats diferents');
  if (v.nivell == null && assolit !== v.assolit) dif.push(`nivell ${assolit} ≠ ${v.assolit}`);
  if (v.valors) {
    const pq = r.preguntes || r.nivells.find((x) => x.nivell === v.nivell).preguntes || [];
    for (const q of pq) {
      const val = A.valor(q, der, v.refs);
      if (!igual(val, v.valors[q.valor])) dif.push(`${q.valor}: ${JSON.stringify(val)} ≠ ${JSON.stringify(v.valors[q.valor])}`);
    }
  }
  if (dif.length) errors.push(`cas ${i} (${v.repte}${v.nivell ? '.' + v.nivell : ''}): ${dif.join('; ')}`);
  else ok++;
}

// comprovacions de l'escala de punts
const punts = D.reptes.reptes.reduce((s, r) => s + r.nivells.reduce((t, n) => t + n.punts, 0), 0);
if (punts !== D.reptes.punts.maxim) errors.push(`els punts sumen ${punts}`);

console.log(`Avaluador JS: ${ok}/${vectors.length} casos idèntics a Python`);
if (errors.length) {
  console.log(errors.slice(0, 20).join('\n'));
  process.exit(1);
}
console.log('RESULTAT: tot correcte');
