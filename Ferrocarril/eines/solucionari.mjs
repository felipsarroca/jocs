// SPDX-License-Identifier: AGPL-3.0-or-later
// Xifra el solucionari del panell docent i en canvia la contrasenya. Cal Node 20 o posterior.
//
//   node eines/solucionari.mjs canvia                       canvia la contrasenya del panell
//   node eines/solucionari.mjs comprova                     diu si una contrasenya obre el solucionari
//   node eines/solucionari.mjs xifra <entrada.json> <sortida>   (ho fa exporta.py del verificador)
//
// La contrasenya es pot donar amb la variable SOLUCIONARI_CLAU; si no hi és, el programa la pregunta.
// Després de canviar-la, publiqueu dades/solucionari.xifrat.json (commit i push): els aparells que ja
// hi havien entrat la tornaran a demanar.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { xifra, desxifra, clauDe } from '../js/xifratge.js';

const ARREL = join(dirname(fileURLToPath(import.meta.url)), '..');
const FITXER = join(ARREL, 'dades', 'solucionari.xifrat.json');

async function pregunta(text) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try { return (await rl.question(text)).trim(); } finally { rl.close(); }
}

async function contrasenyaNova() {
  if (process.env.SOLUCIONARI_CLAU) return process.env.SOLUCIONARI_CLAU;
  const a = await pregunta('Contrasenya nova del panell: ');
  if (a.length < 6) throw new Error('La contrasenya ha de tenir 6 caràcters com a mínim.');
  if (a !== await pregunta('Torneu-la a escriure: ')) throw new Error('Les dues contrasenyes no coincideixen.');
  return a;
}

async function obre(fitxer, contrasenya) {
  const obj = JSON.parse(readFileSync(fitxer, 'utf8'));
  try { return { obj, text: await desxifra(obj, await clauDe(obj, contrasenya)) }; } catch (_) { return { obj, text: null }; }
}

const desa = (fitxer, obj) => writeFileSync(fitxer, JSON.stringify(obj) + '\n');

const [ordre, ...args] = process.argv.slice(2);
try {
  if (ordre === 'xifra') {
    const [entrada, sortida = FITXER] = args;
    const text = readFileSync(entrada, 'utf8');
    const empremta = createHash('sha256').update(text).digest('hex').slice(0, 16);
    const clau = await (process.env.SOLUCIONARI_CLAU ? process.env.SOLUCIONARI_CLAU : pregunta('Contrasenya del panell: '));
    if (existsSync(sortida)) {
      const { obj, text: vell } = await obre(sortida, clau);
      if (vell === null) throw new Error('Aquesta contrasenya no obre el solucionari actual. Si la voleu canviar, feu servir «canvia».');
      if (obj.empremta === empremta) { console.log('solucionari xifrat: sense canvis'); process.exit(0); }
    }
    desa(sortida, await xifra(text, clau, empremta));
    console.log(`solucionari xifrat: ${sortida}`);
  } else if (ordre === 'canvia') {
    const actual = process.env.SOLUCIONARI_CLAU_ACTUAL || await pregunta('Contrasenya actual del panell: ');
    const { obj, text } = await obre(FITXER, actual);
    if (text === null) throw new Error('La contrasenya actual no és correcta.');
    desa(FITXER, await xifra(text, await contrasenyaNova(), obj.empremta));
    console.log('Contrasenya canviada. Publiqueu dades/solucionari.xifrat.json.');
  } else if (ordre === 'comprova') {
    const clau = process.env.SOLUCIONARI_CLAU || await pregunta('Contrasenya del panell: ');
    const { text } = await obre(FITXER, clau);
    console.log(text === null ? 'No: aquesta contrasenya no obre el solucionari.' : 'Sí: la contrasenya és correcta.');
    process.exit(text === null ? 1 : 0);
  } else {
    console.log('Ús: node eines/solucionari.mjs canvia | comprova | xifra <entrada.json> [sortida]');
    process.exit(2);
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
