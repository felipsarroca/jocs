/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Configuració pública del joc i connexió Firebase per a sales en línia */

export const FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDgMHTSDSg4ihrnW2YqNrMPkRkMfg3OlHU',
  authDomain: 'flota-naval-cat.firebaseapp.com',
  projectId: 'flota-naval-cat',
  storageBucket: 'flota-naval-cat.firebasestorage.app',
  messagingSenderId: '450674222735',
  appId: '1:450674222735:web:cf48348f09aa9c3ee8f2fa'
};

export const ROOM_CODE_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
export const ROOM_CODE_LENGTH = 4;
export const PLAYER_ID_KEY = 'flota:playerId';
export const ONLINE_SESSION_KEY = 'flota:onlineSession';
