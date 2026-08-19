const DB_NAME = "tantrix-discovery";
const DB_VERSION = 1;
const FALLBACK_PREFIX = "tantrix-db:";

let databasePromise;

function openDatabase() {
  if (!window.indexedDB) return Promise.resolve(null);
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      for (const store of ["players", "games", "queue", "meta"]) {
        if (!database.objectStoreNames.contains(store)) database.createObjectStore(store, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }).catch(() => null);
  return databasePromise;
}

async function transact(storeName, mode, action) {
  const database = await openDatabase();
  if (!database) return action(null);
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = action(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getRecord(store, key) {
  const database = await openDatabase();
  if (!database) return JSON.parse(localStorage.getItem(`${FALLBACK_PREFIX}${store}:${key}`) || "null");
  return transact(store, "readonly", objectStore => objectStore.get(key));
}

export async function putRecord(store, key, value) {
  const record = { key, ...value };
  const database = await openDatabase();
  if (!database) {
    localStorage.setItem(`${FALLBACK_PREFIX}${store}:${key}`, JSON.stringify(record));
    return record;
  }
  return transact(store, "readwrite", objectStore => objectStore.put(record));
}

export async function deleteRecord(store, key) {
  const database = await openDatabase();
  if (!database) {
    localStorage.removeItem(`${FALLBACK_PREFIX}${store}:${key}`);
    return;
  }
  return transact(store, "readwrite", objectStore => objectStore.delete(key));
}

export async function getAllRecords(store) {
  const database = await openDatabase();
  if (!database) {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(`${FALLBACK_PREFIX}${store}:`))
      .map(key => JSON.parse(localStorage.getItem(key)));
  }
  return transact(store, "readonly", objectStore => objectStore.getAll());
}
