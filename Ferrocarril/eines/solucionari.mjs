// SPDX-License-Identifier: AGPL-3.0-or-later
// Xifra el solucionari del panell docent i els imprimibles protegits, i en canvia la contrasenya. Cal Node 20 o posterior.
//
//   node eines/solucionari.mjs canvia                          canvia la contrasenya del panell
//   node eines/solucionari.mjs comprova                        diu si una contrasenya obre el solucionari
//   node eines/solucionari.mjs xifra <entrada.json> <sortida> [id=fitxer.pdf ...]   (ho fa exporta.py del verificador)
//   node eines/solucionari.mjs impresos id=fitxer.pdf ...      actualitza els imprimibles protegits (ho fa materials.py)
//
// La contrasenya es pot donar amb la variable SOLUCIONARI_CLAU; si no hi és, el programa la pregunta.
// Els imprimibles protegits (prova individual i carpeta docent) es desen xifrats a dades/impresos/<id>.bin
// amb una clau pròpia que viu dins del solucionari: canviar la contrasenya només toca el solucionari.
// Si la contrasenya no canvia, la clau tampoc (es conserva la sal) i els aparells no la tornen a demanar.
// Després de qualsevol canvi, publiqueu dades/ (commit i push).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { xifra, desxifra, clauDe, xifraBytes, clauNova } from '../js/xifratge.js';

const ARREL = join(dirname(fileURLToPath(import.meta.url)), '..');
const FITXER = join(ARREL, 'dades', 'solucionari.xifrat.json');
const IMPRESOS = join(ARREL, 'dades', 'impresos');

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

const contrasenya = async () => process.env.SOLUCIONARI_CLAU || pregunta('Contrasenya del panell: ');

async function obre(fitxer, clau) {
  const obj = JSON.parse(readFileSync(fitxer, 'utf8'));
  try { return { obj, text: await desxifra(obj, await clauDe(obj, clau)) }; } catch (_) { return { obj, text: null }; }
}

const desa = (fitxer, obj) => writeFileSync(fitxer, JSON.stringify(obj) + '\n');
const sha = (dades) => createHash('sha256').update(dades).digest('hex').slice(0, 16);

/** xifra els PDF que han canviat; conserva la clau i els fitxers dels que no han canviat */
async function impresos(anteriors, parells) {
  const clau = anteriors?.clau || clauNova();
  const fitxers = [];
  mkdirSync(IMPRESOS, { recursive: true });
  for (const parell of parells) {
    const [id, cami] = parell.split(/=(.*)/s);
    if (!id || !cami) throw new Error(`Imprimible mal indicat: ${parell} (cal id=fitxer.pdf)`);
    const bytes = readFileSync(cami);
    const entrada = { id, fitxer: `dades/impresos/${id}.bin`, sha: sha(bytes) };
    const abans = anteriors?.fitxers?.find((f) => f.id === id);
    if (!(abans?.sha === entrada.sha && anteriors?.clau === clau && existsSync(join(ARREL, entrada.fitxer)))) {
      writeFileSync(join(ARREL, entrada.fitxer), await xifraBytes(bytes, clau));
      console.log(`imprimible xifrat: ${entrada.fitxer}`);
    }
    fitxers.push(entrada);
  }
  // els imprimibles que no s'han tornat a indicar es conserven
  for (const f of anteriors?.fitxers || []) if (!fitxers.some((x) => x.id === f.id)) fitxers.push(f);
  return { clau, fitxers };
}

/** desa el solucionari si ha canviat; amb la mateixa contrasenya, conserva la sal (i la clau dels aparells) */
async function desaSolucionari(sortida, dades, clau, obj) {
  const text = JSON.stringify(dades);
  const empremta = sha(text);
  if (obj?.empremta === empremta) { console.log('solucionari xifrat: sense canvis'); return; }
  desa(sortida, await xifra(text, clau, empremta, obj?.kdf?.sal));
  console.log(`solucionari xifrat: ${sortida}`);
}

const [ordre, ...args] = process.argv.slice(2);
try {
  if (ordre === 'xifra') {
    const [entrada, sortida = FITXER, ...parells] = args;
    const dades = JSON.parse(readFileSync(entrada, 'utf8'));
    const clau = await contrasenya();
    let obj = null, vell = null;
    if (existsSync(sortida)) {
      ({ obj, text: vell } = await obre(sortida, clau));
      if (vell === null) throw new Error('Aquesta contrasenya no obre el solucionari actual. Si la voleu canviar, feu servir «canvia».');
    }
    const anteriors = vell ? JSON.parse(vell).impresos : null;
    if (parells.length || anteriors) dades.impresos = await impresos(anteriors, parells);
    await desaSolucionari(sortida, dades, clau, obj);
  } else if (ordre === 'impresos') {
    const clau = await contrasenya();
    const { obj, text } = await obre(FITXER, clau);
    if (text === null) throw new Error('Aquesta contrasenya no obre el solucionari.');
    const dades = JSON.parse(text);
    dades.impresos = await impresos(dades.impresos, args);
    await desaSolucionari(FITXER, dades, clau, obj);
  } else if (ordre === 'canvia') {
    const actual = process.env.SOLUCIONARI_CLAU_ACTUAL || await pregunta('Contrasenya actual del panell: ');
    const { obj, text } = await obre(FITXER, actual);
    if (text === null) throw new Error('La contrasenya actual no és correcta.');
    desa(FITXER, await xifra(text, await contrasenyaNova(), obj.empremta));
    console.log('Contrasenya canviada. Publiqueu dades/solucionari.xifrat.json.');
  } else if (ordre === 'comprova') {
    const { text } = await obre(FITXER, await contrasenya());
    console.log(text === null ? 'No: aquesta contrasenya no obre el solucionari.' : 'Sí: la contrasenya és correcta.');
    process.exit(text === null ? 1 : 0);
  } else {
    console.log('Ús: node eines/solucionari.mjs canvia | comprova | xifra <entrada.json> [sortida] [id=pdf ...] | impresos id=pdf ...');
    process.exit(2);
  }
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
