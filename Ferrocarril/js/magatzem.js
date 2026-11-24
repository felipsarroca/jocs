/* SPDX-License-Identifier: AGPL-3.0-or-later */
/* Magatzem de dades de les tandes, amb la mateixa interfície en mode local i amb Firestore.
   Els camins segueixen l'estructura del document 10 de la SdA:
   tandes/{t}, tandes/{t}/grups/{g}, tandes/{t}/grups/{g}/reptes/{codi}...
   Un camí amb un nombre parell de trossos és un document; amb un nombre senar, una col·lecció. */
import { FIREBASE_CONFIG, FB_VER, STORAGE_KEYS, DEMO } from './config.js';

const esDocument = (cami) => cami.split('/').length % 2 === 0;

function idAleatori(n = 16) {
  const abc = 'abcdefghijkmnopqrstuvwxyz23456789';
  const arr = new Uint32Array(n);
  crypto.getRandomValues(arr);
  return Array.from(arr, (x) => abc[x % abc.length]).join('');
}

/* ---------------------------------------------------------------- mode local */
function magatzemLocal() {
  const observadors = new Set();
  let uid = localStorage.getItem(STORAGE_KEYS.UID_LOCAL);
  if (!uid) {
    uid = 'local-' + idAleatori(10);
    localStorage.setItem(STORAGE_KEYS.UID_LOCAL, uid);
  }
  const llegeix = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.BD_LOCAL) || '{}'); } catch (_) { return {}; }
  };
  const escriu = (bd) => {
    localStorage.setItem(STORAGE_KEYS.BD_LOCAL, JSON.stringify(bd));
    avisa();
  };
  const copia = (x) => (x == null ? null : JSON.parse(JSON.stringify(x)));
  const fills = (bd, col) => Object.keys(bd)
    .filter((k) => k.startsWith(col + '/') && !k.slice(col.length + 1).includes('/'))
    .map((k) => ({ id: k.slice(col.length + 1), ...copia(bd[k]) }));

  function avisa() {
    const bd = llegeix();
    for (const o of observadors) {
      o.cb(esDocument(o.cami) ? copia(bd[o.cami] ?? null) : fills(bd, o.cami));
    }
  }
  window.addEventListener('storage', (e) => { if (e.key === STORAGE_KEYS.BD_LOCAL) avisa(); });

  return {
    mode: 'local',
    uid: () => uid,
    async get(cami) { return copia(llegeix()[cami] ?? null); },
    async set(cami, dades) { const bd = llegeix(); bd[cami] = copia(dades); escriu(bd); },
    async update(cami, camps) {
      const bd = llegeix();
      if (!bd[cami]) throw new Error('NO_EXISTEIX');
      bd[cami] = { ...bd[cami], ...copia(camps) };
      escriu(bd);
    },
    async add(col, dades) { const id = idAleatori(); await this.set(`${col}/${id}`, dades); return id; },
    async list(col, filtre = null) {
      let out = fills(llegeix(), col);
      if (filtre) out = out.filter((d) => d[filtre[0]] === filtre[1]);
      return out;
    },
    async remove(cami) {
      const bd = llegeix();
      for (const k of Object.keys(bd)) if (k === cami || k.startsWith(cami + '/')) delete bd[k];
      escriu(bd);
    },
    watch(cami, cb) {
      const o = { cami, cb };
      observadors.add(o);
      queueMicrotask(() => {
        const bd = llegeix();
        cb(esDocument(cami) ? copia(bd[cami] ?? null) : fills(bd, cami));
      });
      return () => observadors.delete(o);
    }
  };
}

/* ---------------------------------------------------------------- Firestore */
async function magatzemFirestore() {
  const base = `https://www.gstatic.com/firebasejs/${FB_VER}`;
  const [appMod, fs, authMod] = await Promise.all([
    import(`${base}/firebase-app.js`), import(`${base}/firebase-firestore.js`), import(`${base}/firebase-auth.js`)
  ]);
  const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(FIREBASE_CONFIG);
  let db;
  try {
    db = fs.initializeFirestore(app, { localCache: fs.persistentLocalCache() });
  } catch (_) {
    db = fs.getFirestore(app);
  }
  const auth = authMod.getAuth(app);
  await auth.authStateReady();
  if (!auth.currentUser) await authMod.signInAnonymously(auth);
  const ref = (cami) => fs.doc(db, cami);
  const col = (cami) => fs.collection(db, cami);
  const llista = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    mode: 'firestore',
    uid: () => auth.currentUser?.uid,
    async get(cami) { const s = await fs.getDoc(ref(cami)); return s.exists() ? s.data() : null; },
    async set(cami, dades) { await fs.setDoc(ref(cami), dades); },
    async update(cami, camps) { await fs.updateDoc(ref(cami), camps); },
    async add(cami, dades) { const r = await fs.addDoc(col(cami), dades); return r.id; },
    async list(cami, filtre = null) {
      const q = filtre ? fs.query(col(cami), fs.where(filtre[0], '==', filtre[1])) : col(cami);
      return llista(await fs.getDocs(q));
    },
    async remove(cami) { await fs.deleteDoc(ref(cami)); },
    watch(cami, cb, enError = () => {}) {
      if (esDocument(cami)) return fs.onSnapshot(ref(cami), (s) => cb(s.exists() ? s.data() : null), enError);
      return fs.onSnapshot(col(cami), (s) => cb(llista(s)), enError);
    }
  };
}

let promesa = null;

/** Retorna el magatzem (Firestore si hi ha configuració i connexió; si no, local). */
export function obreMagatzem() {
  if (!promesa) {
    promesa = (async () => {
      if (!FIREBASE_CONFIG || DEMO) return magatzemLocal();
      return magatzemFirestore();
    })();
  }
  return promesa;
}

export { idAleatori };
