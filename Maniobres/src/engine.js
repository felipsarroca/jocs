// SPDX-License-Identifier: AGPL-3.0-or-later
export const CONFIGS = [
  { id: "mini", name: "Estació petita", caps: [3, 2, 2], h: 2, n: 5, t: 3 },
  {
    id: "intermedia",
    name: "Estació intermèdia",
    caps: [4, 3, 3],
    h: 3,
    n: 7,
    t: 4,
  },
  {
    id: "classic",
    name: "Inglenook clàssic",
    caps: [5, 3, 3],
    h: 3,
    n: 8,
    t: 5,
  },
  { id: "curta", name: "Maniobra curta", caps: [5, 3, 3], h: 2, n: 8, t: 5 },
  {
    id: "asimetrica",
    name: "Una via més curta",
    caps: [5, 3, 2],
    h: 3,
    n: 8,
    t: 5,
  },
  {
    id: "estreta",
    name: "Vies auxiliars curtes",
    caps: [5, 2, 2],
    h: 3,
    n: 7,
    t: 5,
  },
  {
    id: "compacta",
    name: "Estació compacta",
    caps: [4, 2, 2],
    h: 2,
    n: 6,
    t: 4,
  },
];
export const clone = (s) => s.map((a) => a.slice());
export function key(s) {
  let n = 1;
  for (let i = 0; i < 4; i++) {
    if (i) n = n * 10 + 9;
    for (const w of s[i]) n = n * 10 + w;
  }
  return n;
}
export function decode(n) {
  return String(n)
    .slice(1)
    .split("9")
    .map((x) => [...x].map(Number));
}
export function canonical(s, t) {
  return s.map((a) => a.map((w) => (w > t ? 0 : w)));
}
export function legal(s, c, via, k) {
  if (!Number.isInteger(via) || via < 1 || via > 3 || !Number.isInteger(k))
    return false;
  const total = s[0].length + s[via].length;
  return (
    k >= 0 &&
    k <= c.h &&
    k <= total &&
    total - k <= c.caps[via - 1] &&
    k !== s[0].length
  );
}
export function move(s, c, via, k) {
  if (!legal(s, c, via, k)) throw Error("Maniobra no permesa");
  const r = clone(s),
    a = [...s[0], ...s[via]];
  r[0] = a.slice(0, k);
  r[via] = a.slice(k);
  return r;
}
export function won(s, c) {
  return s[1].length === c.t && s[1].every((w, i) => w === i + 1);
}
export function moves(s, c) {
  const a = [];
  for (let v = 1; v <= 3; v++)
    for (let k = 0; k <= c.h; k++) if (legal(s, c, v, k)) a.push([v, k]);
  return a;
}
export function solveTable(c) {
  const dist = new Map(),
    queue = [];
  for (let b = 0; b <= c.caps[1]; b++)
    for (let cc = 0; cc <= c.caps[2]; cc++)
      for (let h = 0; h <= c.h; h++)
        if (b + cc + h === c.n - c.t) {
          const s = [
            Array(h).fill(0),
            Array.from({ length: c.t }, (_, i) => i + 1),
            Array(b).fill(0),
            Array(cc).fill(0),
          ];
          dist.set(key(s), 0);
          queue.push(s);
        }
  for (let p = 0; p < queue.length; p++) {
    const s = queue[p],
      d = dist.get(key(s));
    for (const [v, k] of moves(s, c)) {
      const n = move(s, c, v, k),
        id = key(n);
      if (!dist.has(id)) {
        dist.set(id, d + 1);
        queue.push(n);
      }
    }
  }
  return { dist, states: queue };
}
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(s) {
  let n = 2166136261;
  for (const c of String(s)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  return n >>> 0;
}
export function dateKey(d = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}
export function daily(catalog, date = dateKey()) {
  const a = catalog.filter(
    (p) => p.config === "classic" && p.min >= 9 && p.min <= 15,
  );
  return a[hash(date) % a.length];
}
export function stars(count, min) {
  return count === min ? 3 : count <= min + 2 ? 2 : 1;
}
export function puzzleFromKey(id) {
  const m = /^v1-(classic)-(\d{4,14})$/.exec(id || "");
  if (!m) return null;
  const c = CONFIGS.find((c) => c.id === m[1]),
    s = decode(Number(m[2]));
  if (
    s.length !== 4 ||
    s[0].length ||
    s.some((a, i) => a.length > (i ? c.caps[i - 1] : c.h))
  )
    return null;
  const flat = s.flat();
  if (
    flat.length !== c.n ||
    flat.filter((w) => w === 0).length !== c.n - c.t ||
    Array.from({ length: c.t }, (_, i) => i + 1).some(
      (w) => flat.filter((x) => x === w).length !== 1,
    )
  )
    return null;
  let z = c.t;
  return {
    id,
    config: c.id,
    state: s.map((a) => a.map((w) => w || ++z)),
    min: null,
  };
}
export function replay(p, log) {
  const c = CONFIGS.find((c) => c.id === p.config);
  let s = clone(p.state);
  if (!Array.isArray(log) || log.length > 500)
    throw Error("Historial no vàlid");
  for (const m of log) {
    if (!Array.isArray(m) || m.length !== 2) throw Error("Moviment no vàlid");
    s = move(s, c, ...m);
  }
  return won(s, c);
}
