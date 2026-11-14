/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Client de sales multijugador en temps real mitjançant Firebase Firestore */

import { FIREBASE_CONFIG, ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH, PLAYER_ID_KEY } from './config.js';

const FB_APP_URL = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
const FB_FS_URL = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

let fbPromise = null;

async function loadFirebase() {
  if (!navigator.onLine) {
    throw new Error('No hi ha connexió a internet per jugar en línia.');
  }
  if (!fbPromise) {
    fbPromise = (async () => {
      const [appMod, fsMod] = await Promise.all([import(FB_APP_URL), import(FB_FS_URL)]);
      const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(FIREBASE_CONFIG);
      const db = fsMod.getFirestore(app);
      return { db, fs: fsMod };
    })().catch((err) => {
      fbPromise = null;
      throw err;
    });
  }
  return fbPromise;
}

export function getPlayerId() {
  let id = localStorage.getItem(PLAYER_ID_KEY);
  if (!id) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    try {
      localStorage.setItem(PLAYER_ID_KEY, id);
    } catch (_) {}
  }
  return id;
}

export function normalizeRoomCode(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, ROOM_CODE_LENGTH);
}

function generateRoomCode() {
  const bytes = new Uint8Array(ROOM_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[bytes[i] % ROOM_CODE_ALPHABET.length];
  }
  return code;
}

export class OnlineRoomClient {
  constructor() {
    this.unsub = null;
    this.roomCode = null;
    this.role = null;
    this.playerId = getPlayerId();
  }

  disconnect() {
    if (this.unsub) {
      this.unsub();
      this.unsub = null;
    }
    this.roomCode = null;
    this.role = null;
  }

  async createRoom(onUpdate, onError) {
    const { db, fs } = await loadFirebase();
    let code = null;

    for (let attempt = 0; attempt < 6; attempt++) {
      const candidate = generateRoomCode();
      const ref = fs.doc(db, 'sales', candidate);
      try {
        await fs.runTransaction(db, async (tx) => {
          const snap = await tx.get(ref);
          if (snap.exists()) {
            const data = snap.data();
            const stale = typeof data.updatedMs === 'number' && Date.now() - data.updatedMs > 24 * 3600 * 1000;
            if (!stale) throw new Error('CODE_TAKEN');
          }
          const now = Date.now();
          const docData = {
            code: candidate,
            status: 'waiting',
            starter: 'p1',
            turn: 'p1',
            updatedMs: now,
            p1: {
              id: this.playerId,
              ready: false,
              hash: null,
              sunkCount: 0,
              reveal: null,
              seenMs: now
            },
            p2: null,
            pendingShot: null,
            shots: [],
            winner: null,
            rematch: { p1: false, p2: false }
          };
          if (snap.exists()) {
            tx.update(ref, docData);
          } else {
            tx.set(ref, docData);
          }
        });
        code = candidate;
        break;
      } catch (err) {
        if (err.message !== 'CODE_TAKEN') throw err;
      }
    }

    if (!code) {
      throw new Error('No s’ha pogut generar una sala nova. Torna-ho a provar.');
    }

    this.roomCode = code;
    this.role = 'p1';
    this._subscribe(db, fs, code, onUpdate, onError);
    return { code, role: 'p1' };
  }

  async joinRoom(rawCode, onUpdate, onError) {
    const code = normalizeRoomCode(rawCode);
    if (code.length !== ROOM_CODE_LENGTH) {
      throw new Error('El codi ha de tenir 5 caràcters.');
    }
    const { db, fs } = await loadFirebase();
    const ref = fs.doc(db, 'sales', code);
    let assignedRole = null;

    await fs.runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        throw new Error('No s’ha trobat cap partida amb aquest codi.');
      }
      const data = snap.data();
      const now = Date.now();

      if (data.p1 && data.p1.id === this.playerId) {
        assignedRole = 'p1';
        tx.update(ref, {
          'p1.seenMs': now,
          updatedMs: now
        });
        return;
      }

      if (data.p2 && data.p2.id === this.playerId) {
        assignedRole = 'p2';
        tx.update(ref, {
          'p2.seenMs': now,
          updatedMs: now
        });
        return;
      }

      if (data.p2) {
        throw new Error('Aquesta sala ja té dos jugadors.');
      }

      assignedRole = 'p2';
      tx.update(ref, {
        status: data.status === 'waiting' ? 'placing' : data.status,
        updatedMs: now,
        p2: {
          id: this.playerId,
          ready: false,
          hash: null,
          sunkCount: 0,
          reveal: null,
          seenMs: now
        }
      });
    });

    this.roomCode = code;
    this.role = assignedRole;
    this._subscribe(db, fs, code, onUpdate, onError);
    return { code, role: assignedRole };
  }

  _subscribe(db, fs, code, onUpdate, onError) {
    if (this.unsub) this.unsub();
    const ref = fs.doc(db, 'sales', code);
    this.unsub = fs.onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) return;
        onUpdate(snap.data());
      },
      (err) => {
        if (onError) onError(err);
      }
    );
  }

  async setReady(hash) {
    if (!this.roomCode || !this.role) return;
    const { db, fs } = await loadFirebase();
    const ref = fs.doc(db, 'sales', this.roomCode);

    await fs.runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      const me = data[this.role];
      const otherRole = this.role === 'p1' ? 'p2' : 'p1';
      const other = data[otherRole];
      const now = Date.now();

      const updatedMe = {
        ...(me || { id: this.playerId, sunkCount: 0, reveal: null }),
        ready: true,
        hash,
        seenMs: now
      };

      const bothReady = Boolean(other && other.ready);
      const nextStatus = bothReady ? 'playing' : (other ? 'placing' : 'waiting');

      tx.update(ref, {
        [this.role]: updatedMe,
        status: nextStatus,
        turn: bothReady ? (data.starter || 'p1') : data.turn,
        updatedMs: now
      });
    });
  }

  async sendShot(r, c) {
    if (!this.roomCode || !this.role) return;
    const { db, fs } = await loadFirebase();
    const ref = fs.doc(db, 'sales', this.roomCode);

    await fs.runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status !== 'playing') return;
      if (data.turn !== this.role) return;
      if (data.pendingShot) return;

      const shots = Array.isArray(data.shots) ? data.shots : [];
      const already = shots.some((s) => s.by === this.role && s.r === r && s.c === c);
      if (already) return;

      const now = Date.now();
      tx.update(ref, {
        pendingShot: {
          seq: shots.length + 1,
          by: this.role,
          r,
          c
        },
        updatedMs: now
      });
    });
  }

  async resolvePendingShot(seq, outcome, ownRevealIfFinished = null) {
    if (!this.roomCode || !this.role) return;
    const { db, fs } = await loadFirebase();
    const ref = fs.doc(db, 'sales', this.roomCode);

    await fs.runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      const pending = data.pendingShot;
      if (!pending || pending.seq !== seq || pending.by === this.role) return;

      const shots = Array.isArray(data.shots) ? [...data.shots] : [];
      shots.push({
        seq: pending.seq,
        by: pending.by,
        r: pending.r,
        c: pending.c,
        result: outcome.result,
        sunkShip: outcome.sunkShip
          ? {
              id: outcome.sunkShip.id,
              name: outcome.sunkShip.name,
              size: outcome.sunkShip.size,
              r: outcome.sunkShip.r,
              c: outcome.sunkShip.c,
              o: outcome.sunkShip.o
            }
          : null
      });

      const currentSunk = (data[this.role]?.sunkCount || 0) + (outcome.result === 'enfonsat' ? 1 : 0);
      const nextTurn = this.role; // El defensor passa a tenir el torn
      const now = Date.now();

      const patch = {
        shots,
        pendingShot: null,
        [`${this.role}.sunkCount`]: currentSunk,
        [`${this.role}.seenMs`]: now,
        updatedMs: now
      };

      if (outcome.allSunk) {
        patch.status = 'finished';
        patch.winner = pending.by;
        if (ownRevealIfFinished) {
          patch[`${this.role}.reveal`] = ownRevealIfFinished;
        }
      } else {
        patch.turn = nextTurn;
      }

      tx.update(ref, patch);
    });
  }

  async submitReveal(revealData) {
    if (!this.roomCode || !this.role) return;
    const { db, fs } = await loadFirebase();
    const ref = fs.doc(db, 'sales', this.roomCode);
    await fs.updateDoc(ref, {
      [`${this.role}.reveal`]: revealData,
      updatedMs: Date.now()
    });
  }

  async requestRematch() {
    if (!this.roomCode || !this.role) return;
    const { db, fs } = await loadFirebase();
    const ref = fs.doc(db, 'sales', this.roomCode);

    await fs.runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status !== 'finished') return;

      const rematch = { ...(data.rematch || { p1: false, p2: false }), [this.role]: true };
      const now = Date.now();

      if (rematch.p1 && rematch.p2) {
        const nextStarter = data.starter === 'p1' ? 'p2' : 'p1';
        tx.update(ref, {
          status: 'placing',
          starter: nextStarter,
          turn: nextStarter,
          pendingShot: null,
          shots: [],
          winner: null,
          rematch: { p1: false, p2: false },
          'p1.ready': false,
          'p1.hash': null,
          'p1.sunkCount': 0,
          'p1.reveal': null,
          'p2.ready': false,
          'p2.hash': null,
          'p2.sunkCount': 0,
          'p2.reveal': null,
          updatedMs: now
        });
      } else {
        tx.update(ref, {
          [`rematch.${this.role}`]: true,
          updatedMs: now
        });
      }
    });
  }
}
