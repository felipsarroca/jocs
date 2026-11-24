/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Configuració de «Pròxima sortida».
   Projecte de Firebase: proxima-sortida-cat (compte personal de Felip, Firestore eur3, accés anònim).
   La configuració web és pública: la protecció són les regles de firebase/firestore.rules.
   Amb FIREBASE_CONFIG = null l'app funciona en mode local (només en aquest navegador). */

export const VERSIO_APP = '0.2.0';

/** adreça curta de l'app (targetes d'accés, fulls impresos i manual) */
export const URL_APP = 'ja.cat/estaciodetren';

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyASsxZwl2u4JjR92dPC0iPBQ8-XseP_iC8',
  authDomain: 'proxima-sortida-cat.firebaseapp.com',
  projectId: 'proxima-sortida-cat',
  storageBucket: 'proxima-sortida-cat.firebasestorage.app',
  messagingSenderId: '242636977045',
  appId: '1:242636977045:web:8feb663070cdeefe6fbc9c'
};

export const FB_VER = '10.14.1';

export const LIMITS = {
  MAX_GRUPS: 12,
  MAX_NOM_TANDA: 60,
  DIES_CADUCITAT: 120,
  MAX_BITLLETS: 20,
  SEGONS_DESAT: 2
};

export const NOMS_GRUPS = ['Talgo', 'Alvia', 'Avant', 'Intercity', 'Rodalies', 'Euromed', 'Trenhotel', 'Altaria', 'Alaris', 'Intercidades', 'Lusitânia', 'Alfa Pendular'];

export const STORAGE_KEYS = {
  BD_LOCAL: 'proximasortida:bd',
  UID_LOCAL: 'proximasortida:uid',
  ACCES: 'proximasortida:acces',
  DOCENT: 'proximasortida:docent',
  DOCENT_TANDES: 'proximasortida:docent-tandes'
};
