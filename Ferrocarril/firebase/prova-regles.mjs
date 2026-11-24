// SPDX-License-Identifier: AGPL-3.0-or-later
// Prova de les regles de Firestore de «Pròxima sortida» amb l'emulador local (sense projecte al núvol).
// Reprodueix les escriptures que fa l'app (js/agencia.js, js/alumnat.js i js/docent.js).
// Com s'executa (cal Java 21 o posterior; serveix el d'Android Studio):
//   1. En una carpeta temporal: npm i @firebase/rules-unit-testing@3 firebase@10
//   2. Copiar-hi aquest fitxer, firestore.rules i un firebase.json amb {"firestore":{"rules":"firestore.rules"}}
//   3. firebase emulators:exec --only firestore --project demo-ps "node prova-regles.mjs firestore.rules"
// Resultat esperat (24-11-2026): 82 correctes, 0 errors.
import { readFileSync } from 'node:fs';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc, updateDoc, addDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';

const RULES = process.argv[2];
const env = await initializeTestEnvironment({
  projectId: 'demo-ps',
  firestore: { rules: readFileSync(RULES, 'utf8'), host: '127.0.0.1', port: 8080 },
});

let ok = 0, ko = 0;
async function cas(nom, esperat, fn) {
  try {
    await (esperat ? assertSucceeds(fn()) : assertFails(fn()));
    ok++; console.log('  ok  ', nom);
  } catch (e) {
    ko++; console.log('  ERROR', nom, '→', e.message.split('\n')[0]);
  }
}

const ara = Date.now();
const T = 'tandaProva1';
const tanda = { propietariUid: 'docent', nom: 'Tanda de prova', codi: 'AB12', grups: [{ id: 'g1', nom: 'Alfa' }, { id: 'g2', nom: 'Beta' }],
  blocObert: 1, avisViaTallada: false, estat: 'preparacio', versioDades: 'edició 4', creadaMs: ara, expiraMs: ara + 120 * 86400000 };
const grup = (nom, i) => ({ nom, ordre: i, testimoni: null, repteActual: 'R1', punts: 0, nivells: {}, darreraActivitatMs: 0 });

const docent = env.authenticatedContext('docent').firestore();
const altre = env.authenticatedContext('altreDocent').firestore();
const a1 = env.authenticatedContext('alumne1').firestore();   // grup g1
const a2 = env.authenticatedContext('alumne2').firestore();   // grup g2
const anon = env.unauthenticatedContext().firestore();

console.log('Docent crea la tanda (com creaTanda)');
await cas('crea la tanda', true, () => setDoc(doc(docent, `tandes/${T}`), tanda));
await cas('desa el PIN de g1', true, () => setDoc(doc(docent, `tandes/${T}/claus/g1`), { pin: '1234' }));
await cas('desa el PIN de g2', true, () => setDoc(doc(docent, `tandes/${T}/claus/g2`), { pin: '5678' }));
await cas('crea el grup g1', true, () => setDoc(doc(docent, `tandes/${T}/grups/g1`), grup('Alfa', 0)));
await cas('crea el grup g2', true, () => setDoc(doc(docent, `tandes/${T}/grups/g2`), grup('Beta', 1)));
await cas('crea el codi', true, () => setDoc(doc(docent, 'codis/AB12'), { tandaId: T, expiraMs: tanda.expiraMs }));
await cas('un altre docent no pot crear un codi per a la tanda', false, () => setDoc(doc(altre, 'codis/ZZ99'), { tandaId: T, expiraMs: tanda.expiraMs }));
await cas('no es pot crear una tanda a nom d\'un altre', false, () => setDoc(doc(a1, 'tandes/falsa'), { ...tanda, propietariUid: 'docent' }));

console.log('Accés de l\'alumnat');
await cas('sense autenticar no llegeix el codi', false, () => getDoc(doc(anon, 'codis/AB12')));
await cas('llegeix el codi de la tanda', true, () => getDoc(doc(a1, 'codis/AB12')));
await cas('no pot llistar els codis', false, () => getDocs(collection(a1, 'codis')));
await cas('llegeix la tanda', true, () => getDoc(doc(a1, `tandes/${T}`)));
await cas('no llegeix el PIN', false, () => getDoc(doc(a1, `tandes/${T}/claus/g1`)));
await cas('PIN equivocat: no entra', false, () => setDoc(doc(a1, `tandes/${T}/grups/g1/membres/alumne1`), { pin: '0000', entratMs: ara }));
await cas('PIN correcte: entra', true, () => setDoc(doc(a1, `tandes/${T}/grups/g1/membres/alumne1`), { pin: '1234', entratMs: ara }));
await cas('no pot entrar amb l\'uid d\'un altre', false, () => setDoc(doc(a1, `tandes/${T}/grups/g2/membres/alumne2`), { pin: '5678', entratMs: ara }));
await cas('alumne2 entra a g2', true, () => setDoc(doc(a2, `tandes/${T}/grups/g2/membres/alumne2`), { pin: '5678', entratMs: ara }));
await cas('torna a entrar des del mateix aparell (setDoc sobre el document existent)', false,
  () => setDoc(doc(a1, `tandes/${T}/grups/g1/membres/alumne1`), { pin: '1234', entratMs: ara + 1 }));
await cas('…però pot llegir el seu document de membre', true, () => getDoc(doc(a1, `tandes/${T}/grups/g1/membres/alumne1`)));
await cas('…esborrar-lo', true, () => deleteDoc(doc(a1, `tandes/${T}/grups/g1/membres/alumne1`)));
await cas('…i tornar a entrar amb el PIN', true, () => setDoc(doc(a1, `tandes/${T}/grups/g1/membres/alumne1`), { pin: '1234', entratMs: ara + 2 }));

console.log('Treball del grup');
const R1 = { codi: 'R1', estat: 'obert', esborrany: { nivell: 1, bitllets: ['1|NEA1|B|GIR'], entrades: {}, intents: 1 }, actualitzatMs: ara, punts: 100, nivellAssolit: 1,
  nivells: { 1: { bitllets: ['1|NEA1|B|GIR'], respostes: { sortida: 420 } } } };
await cas('llegeix el seu grup', true, () => getDoc(doc(a1, `tandes/${T}/grups/g1`)));
await cas('no llegeix un altre grup', false, () => getDoc(doc(a1, `tandes/${T}/grups/g2`)));
await cas('no llista els grups', false, () => getDocs(collection(a1, `tandes/${T}/grups`)));
await cas('desa R1 (bloc 1 obert)', true, () => setDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R1`), R1));
await cas('no desa R5 (bloc 2 tancat)', false, () => setDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R5`), { ...R1, codi: 'R5' }));
await cas('no desa a un altre grup', false, () => setDoc(doc(a1, `tandes/${T}/grups/g2/reptes/R1`), R1));
await cas('no llegeix els reptes d\'un altre grup', false, () => getDocs(collection(a1, `tandes/${T}/grups/g2/reptes`)));
await cas('codi del document i del repte han de coincidir', false, () => setDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R2`), R1));
await cas('no accepta camps desconeguts', false, () => setDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R1`), { ...R1, trampa: 1 }));
await cas('no accepta més de 1200 punts en un repte', false, () => setDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R1`), { ...R1, punts: 5000 }));
await cas('actualitza el resum del grup (com desaEsborrany)', true, () => updateDoc(doc(a1, `tandes/${T}/grups/g1`),
  { repteActual: 'R1', punts: 100, darreraActivitatMs: ara, nivells: { R1: 1 } }));
await cas('no canvia el nom del grup', false, () => updateDoc(doc(a1, `tandes/${T}/grups/g1`), { nom: 'Hackers' }));
await cas('no posa més de 4000 punts', false, () => updateDoc(doc(a1, `tandes/${T}/grups/g1`), { punts: 9999 }));
await cas('afegeix un intent', true, () => addDoc(collection(a1, `tandes/${T}/grups/g1/intents`),
  { repte: 'R1', nivell: 1, bitllets: ['1|NEA1|B|GIR'], respostes: {}, errors: [], resultat: 'correcte', uid: 'alumne1', ms: ara }));
await cas('no afegeix un intent amb un altre uid', false, () => addDoc(collection(a1, `tandes/${T}/grups/g1/intents`),
  { repte: 'R1', nivell: 1, bitllets: [], respostes: {}, errors: [], resultat: 'correcte', uid: 'alumne2', ms: ara }));
await cas('no obre blocs', false, () => updateDoc(doc(a1, `tandes/${T}`), { blocObert: 4 }));
await cas('no es marca ajudes', false, () => setDoc(doc(a1, `tandes/${T}/valoracio/g1`), { ajuda: [], notes: '' }));
await cas('lliura R1', true, () => setDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R1`), { ...R1, estat: 'lliurat', lliuratMs: ara }));
await cas('R1 lliurat ja no es pot canviar', false, () => setDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R1`), { ...R1, estat: 'obert' }));

console.log('Panell docent');
await cas('el docent llista els grups', true, () => getDocs(collection(docent, `tandes/${T}/grups`)));
await cas('el docent llegeix els PIN', true, () => getDocs(collection(docent, `tandes/${T}/claus`)));
await cas('el docent marca una ajuda', true, () => setDoc(doc(docent, `tandes/${T}/valoracio/g1`), { ajuda: ['R1.2'], notes: '' }));
await cas('el grup llegeix la seva valoració', true, () => getDoc(doc(a1, `tandes/${T}/valoracio/g1`)));
await cas('un altre grup no la llegeix', false, () => getDoc(doc(a2, `tandes/${T}/valoracio/g1`)));
await cas('el docent reobre R1', true, () => updateDoc(doc(docent, `tandes/${T}/grups/g1/reptes/R1`), { estat: 'obert' }));
await cas('el grup torna a treballar R1', true, () => setDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R1`), R1));
await cas('un altre docent no toca la tanda', false, () => updateDoc(doc(altre, `tandes/${T}`), { blocObert: 4 }));
await cas('el docent obre el bloc 4', true, () => updateDoc(doc(docent, `tandes/${T}`), { blocObert: 4, estat: 'en_curs' }));
await cas('R9 sense l\'avís de via tallada: no', false, () => setDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R9`), { ...R1, codi: 'R9' }));
await cas('el docent activa l\'avís', true, () => updateDoc(doc(docent, `tandes/${T}`), { avisViaTallada: true }));
await cas('R9 amb l\'avís: sí', true, () => setDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R9`),
  { ...R1, codi: 'R9', tall: { dia: 1, tram: ['L', 'Z'], primer: '1|I1|B|L', estacio: 'L', arribada: 540, minim: 71, origen: 'B-01' } }));
await cas('el docent desconnecta un aparell', true, () => deleteDoc(doc(docent, `tandes/${T}/grups/g2/membres/alumne2`)));
await cas('l\'aparell desconnectat ja no llegeix el grup', false, () => getDoc(doc(a2, `tandes/${T}/grups/g2`)));
await cas('el docent tanca la tanda', true, () => updateDoc(doc(docent, `tandes/${T}`), { estat: 'tancada' }));
await cas('tanda tancada: el grup no desa', false, () => setDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R2`), { ...R1, codi: 'R2' }));
await cas('tanda tancada: el grup encara la llegeix', true, () => getDoc(doc(a1, `tandes/${T}/grups/g1/reptes/R1`)));

console.log('Contrasenya del professorat');
const HASH = 'a'.repeat(64);
await cas('el docent desa el hash de la contrasenya', true, () => setDoc(doc(docent, `tandes/${T}/clauDocent/clau`), { hash: HASH }));
await cas('un grup no llegeix el hash', false, () => getDoc(doc(a1, `tandes/${T}/clauDocent/clau`)));
await cas('un altre docent no llegeix el hash', false, () => getDoc(doc(altre, `tandes/${T}/clauDocent/clau`)));
await cas('contrasenya equivocada: no entra com a docent', false, () => setDoc(doc(altre, `tandes/${T}/docents/altreDocent`), { hash: 'b'.repeat(64), entratMs: ara }));
await cas('no pot entrar amb l\'uid d\'un altre', false, () => setDoc(doc(altre, `tandes/${T}/docents/alumne1`), { hash: HASH, entratMs: ara }));
await cas('contrasenya correcta: entra com a docent', true, () => setDoc(doc(altre, `tandes/${T}/docents/altreDocent`), { hash: HASH, entratMs: ara }));
await cas('…llegeix els PIN', true, () => getDocs(collection(altre, `tandes/${T}/claus`)));
await cas('…reobre la tanda', true, () => updateDoc(doc(altre, `tandes/${T}`), { estat: 'en_curs' }));
await cas('…però no en canvia el propietari', false, () => updateDoc(doc(altre, `tandes/${T}`), { propietariUid: 'altreDocent' }));
await cas('un grup no es pot fer docent amb el seu PIN', false, () => setDoc(doc(a1, `tandes/${T}/docents/alumne1`), { hash: '1234', entratMs: ara }));

console.log('Calendari: els blocs s\'obren sols');
const DIA = 86400000;
const T2 = 'tandaCalendari';
await cas('crea una tanda amb calendari (trobades 1 i 2 passades, 3 i 4 futures)', true, () => setDoc(doc(docent, `tandes/${T2}`),
  { ...tanda, codi: 'CD34', blocObert: 1, estat: 'en_curs', calendari: [ara - 2 * DIA, ara - DIA, ara + 6 * DIA, ara + 7 * DIA] }));
await cas('el calendari ha de tenir 4 dates', false, () => setDoc(doc(docent, 'tandes/tandaMala'),
  { ...tanda, codi: 'EF56', calendari: [ara] }));
await cas('PIN de g1', true, () => setDoc(doc(docent, `tandes/${T2}/claus/g1`), { pin: '1111' }));
await cas('grup g1', true, () => setDoc(doc(docent, `tandes/${T2}/grups/g1`), grup('Talgo', 0)));
await cas('alumne1 entra', true, () => setDoc(doc(a1, `tandes/${T2}/grups/g1/membres/alumne1`), { pin: '1111', entratMs: ara }));
await cas('R5 (bloc 2, trobada 2 passada) sense que el docent l\'obri', true, () => setDoc(doc(a1, `tandes/${T2}/grups/g1/reptes/R5`), { ...R1, codi: 'R5' }));
await cas('R7 (bloc 3, també a la trobada 2)', true, () => setDoc(doc(a1, `tandes/${T2}/grups/g1/reptes/R7`), { ...R1, codi: 'R7' }));
await cas('R9 abans de la trobada 4: no', false, () => setDoc(doc(a1, `tandes/${T2}/grups/g1/reptes/R9`), { ...R1, codi: 'R9' }));
await cas('el docent avança les dates (la trobada 4 ja ha arribat)', true, () => updateDoc(doc(docent, `tandes/${T2}`),
  { calendari: [ara - 4 * DIA, ara - 3 * DIA, ara - 2 * DIA, ara - DIA] }));
await cas('R9 el dia de la trobada 4, sense activar l\'avís', true, () => setDoc(doc(a1, `tandes/${T2}/grups/g1/reptes/R9`), { ...R1, codi: 'R9' }));
const T3 = 'tandaFutura';
await cas('tanda que encara no ha començat', true, () => setDoc(doc(docent, `tandes/${T3}`),
  { ...tanda, codi: 'GH78', blocObert: 1, calendari: [ara + DIA, ara + 2 * DIA, ara + 8 * DIA, ara + 9 * DIA] }));
await cas('PIN de g1 (tanda futura)', true, () => setDoc(doc(docent, `tandes/${T3}/claus/g1`), { pin: '2222' }));
await cas('alumne1 entra (tanda futura)', true, () => setDoc(doc(a1, `tandes/${T3}/grups/g1/membres/alumne1`), { pin: '2222', entratMs: ara }));
await cas('R1 sempre és obert', true, () => setDoc(doc(a1, `tandes/${T3}/grups/g1/reptes/R1`), R1));
await cas('R5 encara no', false, () => setDoc(doc(a1, `tandes/${T3}/grups/g1/reptes/R5`), { ...R1, codi: 'R5' }));

console.log(`\nRESULTAT: ${ok} correctes, ${ko} errors`);
await env.cleanup();
process.exit(ko ? 1 : 0);
