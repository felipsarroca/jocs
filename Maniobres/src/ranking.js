// SPDX-License-Identifier: AGPL-3.0-or-later
// Rànquing públic amb Firebase (Firestore + accés anònim).
// Cada navegador té un usuari anònim; el nom de jugador és únic i queda lligat al navegador.
// Des d'un altre dispositiu es pot continuar amb el mateix nom (claim): el jugador s'hi trasllada.
// Els resultats no els valida cap servidor: qui obre el rànquing torna a reproduir
// cada solució amb el motor i la taula de mínims, i només compten les correctes.

const SDK = "https://www.gstatic.com/firebasejs/10.14.1/";
const CONFIG = {
  apiKey: "AIzaSyCcP_FVltuyIbnZdcFOU7cCuwz2HFGTKt4",
  authDomain: "maniobres-cat.firebaseapp.com",
  projectId: "maniobres-cat",
  appId: "1:913794385473:web:b84d12d0e0f89d3bd9a8c0",
};
export const YEAR_MS = 365 * 864e5;

let ready = null;
function connect() {
  ready ||= (async () => {
    const [{ initializeApp }, auth, fs] = await Promise.all([
      import(SDK + "firebase-app.js"),
      import(SDK + "firebase-auth.js"),
      import(SDK + "firebase-firestore.js"),
    ]);
    const app = initializeApp(CONFIG),
      a = auth.getAuth(app);
    await auth.setPersistence(a, auth.browserLocalPersistence);
    if (!a.currentUser) {
      await new Promise((r) => {
        const off = auth.onAuthStateChanged(a, () => {
          off();
          r();
        });
      });
    }
    if (!a.currentUser) await auth.signInAnonymously(a);
    return { uid: a.currentUser.uid, db: fs.getFirestore(app), fs, a, auth };
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

// Clau única del nom: minúscules, sense accents ni espais.
export function nameKey(name) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

const BAD = [
  "puta", "puto", "merda", "collo", "colló", "cabro", "cabron", "polla", "coño", "cony",
  "joder", "fuck", "shit", "bitch", "nazi", "hitler", "maricon", "marica", "subnormal",
  "idiota", "imbecil", "gilipollas", "mamon", "zorra", "follar", "pene", "sexo", "sex",
  "porn", "retrasado", "negrata", "moro", "panchito", "violar", "matar", "kill",
];
export function checkName(name) {
  name = name.trim().replace(/\s+/g, " ");
  if (name.length < 3 || name.length > 16) return [null, "El nom ha de tenir entre 3 i 16 caràcters."];
  if (!/^[\p{L}\p{N} ._-]+$/u.test(name))
    return [null, "Fes servir només lletres, números, espais, punts i guions."];
  const k = nameKey(name);
  if (k.length < 3) return [null, "El nom ha de tenir com a mínim tres lletres o números."];
  if (BAD.some((w) => k.includes(nameKey(w)))) return [null, "Aquest nom no és adequat. Tria’n un altre."];
  return [name, null];
}

export async function me() {
  const { uid, db, fs } = await connect(),
    snap = await fs.getDoc(fs.doc(db, "players", uid));
  return snap.exists() ? { uid, ...snap.data() } : { uid, name: null, r: {} };
}

// Registra o canvia el nom. Reserva la clau a names/{clau} i allibera l'anterior.
export async function register(name) {
  const [clean, error] = checkName(name);
  if (error) throw Error(error);
  const { uid, db, fs } = await connect(),
    k = nameKey(clean),
    player = fs.doc(db, "players", uid),
    current = await fs.getDoc(player);
  const taken = await fs.getDoc(fs.doc(db, "names", k));
  if (taken.exists() && taken.data().uid !== uid)
    throw Object.assign(Error("Aquest nom ja s’ha fet servir."), { code: "taken", name: clean });
  const batch = fs.writeBatch(db);
  if (!taken.exists()) batch.set(fs.doc(db, "names", k), { uid });
  if (current.exists()) {
    const old = current.data().key;
    if (old !== k) batch.delete(fs.doc(db, "names", old));
    batch.update(player, { name: clean, key: k });
  } else
    batch.set(player, {
      name: clean,
      key: k,
      since: fs.serverTimestamp(),
      at: fs.serverTimestamp(),
      last: "",
      r: {},
    });
  try {
    await batch.commit();
  } catch {
    throw Error("No s’ha pogut desar el nom. Potser ja està agafat; prova’n un altre.");
  }
  return clean;
}

// Continua amb un nom que ja existeix (per exemple, des d'un altre dispositiu).
// El jugador passa a aquest navegador amb tots els resultats; l'anterior en queda desvinculat.
// Amb onlyExisting, no crea cap nom nou: retorna null si el nom ja no existeix.
export async function claim(name, onlyExisting = false) {
  const [clean, error] = checkName(name);
  if (error) throw Error(error);
  const { uid, db, fs } = await connect(),
    k = nameKey(clean),
    nameRef = fs.doc(db, "names", k),
    taken = await fs.getDoc(nameRef);
  if (!taken.exists()) return onlyExisting ? null : register(clean);
  const oldUid = taken.data().uid;
  if (oldUid === uid) return clean;
  const old = await fs.getDoc(fs.doc(db, "players", oldUid)),
    mine = await fs.getDoc(fs.doc(db, "players", uid)),
    batch = fs.writeBatch(db);
  if (mine.exists() && mine.data().key !== k) batch.delete(fs.doc(db, "names", mine.data().key));
  batch.update(nameRef, { uid });
  if (old.exists()) {
    batch.set(fs.doc(db, "players", uid), old.data());
    batch.delete(old.ref);
  } else
    batch.set(fs.doc(db, "players", uid), {
      name: clean,
      key: k,
      since: fs.serverTimestamp(),
      at: fs.serverTimestamp(),
      last: "",
      r: {},
    });
  try {
    await batch.commit();
  } catch {
    throw Error("No s’ha pogut recuperar el nom. Comprova la connexió i torna-ho a provar.");
  }
  return old.exists() ? old.data().name : clean;
}

// Desa un resultat: la clau del puzle i la seqüència de maniobres.
// Només es desa si millora el resultat anterior del mateix puzle.
export async function submit(puzzle, log) {
  const { uid, db, fs } = await connect(),
    ref = fs.doc(db, "players", uid),
    snap = await fs.getDoc(ref);
  if (!snap.exists()) throw Error("Cal un nom de jugador.");
  const prev = snap.data().r?.[puzzle];
  if (prev && Date.now() - prev.t.toMillis() < YEAR_MS && prev.n <= log.length) return { kept: true };
  const update = {
    at: fs.serverTimestamp(),
    last: puzzle,
    [`r.${puzzle}`]: { n: log.length, l: log.map(([v, k]) => `${v}${k}`).join(""), t: fs.serverTimestamp() },
  };
  // Neteja els resultats caducats del propi jugador.
  for (const [k, v] of Object.entries(snap.data().r || {}))
    if (k !== puzzle && Date.now() - v.t.toMillis() > YEAR_MS) update[`r.${k}`] = fs.deleteField();
  await fs.updateDoc(ref, update);
  return { kept: false };
}

export async function players() {
  const { uid, db, fs } = await connect(),
    snap = await fs.getDocs(fs.collection(db, "players"));
  return {
    uid,
    list: snap.docs.map((d) => ({
      uid: d.id,
      name: d.data().name,
      r: Object.entries(d.data().r || {}).map(([k, v]) => ({ k, n: v.n, l: v.l, t: v.t?.toMillis?.() ?? 0 })),
    })),
  };
}

export async function erase() {
  const { uid, db, fs, a, auth } = await connect(),
    ref = fs.doc(db, "players", uid),
    snap = await fs.getDoc(ref),
    batch = fs.writeBatch(db);
  if (snap.exists()) {
    batch.delete(fs.doc(db, "names", snap.data().key));
    batch.delete(ref);
  }
  await batch.commit();
  await auth.signOut(a);
  ready = null;
}
