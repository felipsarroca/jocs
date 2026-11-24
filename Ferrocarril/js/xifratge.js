/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Xifratge del solucionari del panell docent (AES-GCM amb una clau derivada de la contrasenya amb PBKDF2).
   Els fitxers de l'app són públics: el solucionari es publica xifrat i només el pot llegir qui sap
   la contrasenya del panell. Funciona igual al navegador i a Node (eines/solucionari.mjs). */

export const FORMAT = 'proximasortida-solucionari-1';
const ITERACIONS = 300000;
const enc = new TextEncoder();
const dec = new TextDecoder();
const subtle = () => globalThis.crypto.subtle;

export function aBase64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}
export const deBase64 = (txt) => Uint8Array.from(atob(txt), (c) => c.charCodeAt(0));
const normalitza = (contrasenya) => String(contrasenya).trim().normalize('NFC');

async function derivaClau(contrasenya, sal, iteracions) {
  const base = await subtle().importKey('raw', enc.encode(normalitza(contrasenya)), 'PBKDF2', false, ['deriveKey']);
  return subtle().deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt: sal, iterations: iteracions },
    base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

/** xifra un text amb la contrasenya; retorna l'objecte que es desa en JSON.
    Amb la mateixa contrasenya i la mateixa sal, la clau no canvia i els aparells no la tornen a demanar. */
export async function xifra(text, contrasenya, empremta = null, salAnterior = null) {
  const sal = salAnterior ? deBase64(salAnterior) : globalThis.crypto.getRandomValues(new Uint8Array(16));
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const clau = await derivaClau(contrasenya, sal, ITERACIONS);
  const dades = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, clau, enc.encode(text)));
  return { format: FORMAT, kdf: { nom: 'PBKDF2', hash: 'SHA-256', iteracions: ITERACIONS, sal: aBase64(sal) },
    iv: aBase64(iv), empremta, dades: aBase64(dades) };
}

/** clau AES a partir de la contrasenya i dels paràmetres del fitxer xifrat */
export const clauDe = (obj, contrasenya) => derivaClau(contrasenya, deBase64(obj.kdf.sal), obj.kdf.iteracions);

/** desxifra amb una clau; llança un error si la clau no és la bona */
export async function desxifra(obj, clau) {
  if (obj?.format !== FORMAT) throw new Error('FORMAT');
  const dades = await subtle().decrypt({ name: 'AES-GCM', iv: deBase64(obj.iv) }, clau, deBase64(obj.dades));
  return dec.decode(dades);
}

/* Imprimibles protegits (prova individual i carpeta docent): cada PDF es xifra amb una clau pròpia
   (AES-GCM) que viu dins del solucionari. Fitxer = vector d'inicialització (12 bytes) + dades xifrades.
   Així, canviar la contrasenya del panell només toca el solucionari. */
const clauBytes = (b64, usos) => subtle().importKey('raw', deBase64(b64), { name: 'AES-GCM' }, false, usos);
export async function xifraBytes(bytes, clauB64) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const dades = new Uint8Array(await subtle().encrypt({ name: 'AES-GCM', iv }, await clauBytes(clauB64, ['encrypt']), bytes));
  const out = new Uint8Array(12 + dades.length);
  out.set(iv); out.set(dades, 12);
  return out;
}
export async function desxifraBytes(bytes, clauB64) {
  const b = new Uint8Array(bytes);
  return new Uint8Array(await subtle().decrypt({ name: 'AES-GCM', iv: b.subarray(0, 12) }, await clauBytes(clauB64, ['decrypt']), b.subarray(12)));
}
export const clauNova = () => aBase64(globalThis.crypto.getRandomValues(new Uint8Array(32)));

/** la clau es guarda a l'aparell per no haver de tornar a escriure la contrasenya */
export const exportaClau = async (clau) => aBase64(new Uint8Array(await subtle().exportKey('raw', clau)));
export const importaClau = (txt) => subtle().importKey('raw', deBase64(txt), { name: 'AES-GCM' }, true, ['decrypt']);
