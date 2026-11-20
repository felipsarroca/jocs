// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  canonical,
  key,
  moves,
  move,
  won,
  score,
  CONFIGS,
  puzzleFromKey,
} from "./engine.js";
const tables = new Map();
async function table(id) {
  if (!tables.has(id)) {
    const r = await fetch(new URL(`../data/${id}.bin`, import.meta.url));
    if (!r.ok) throw Error("No es pot carregar el solucionador");
    const b = new DataView(await r.arrayBuffer()),
      m = new Map();
    for (let i = 0; i < b.byteLength; i += 9)
      m.set(b.getFloat64(i, true), b.getUint8(i + 8));
    tables.set(id, m);
  }
  return tables.get(id);
}
self.onmessage = async ({ data }) => {
  try {
    const { config, state, request } = data,
      c = CONFIGS.find((c) => c.id === config),
      t = await table(config);
    if (data.type === "verify") {
      // Torna a jugar cada solució del rànquing i en calcula els punts.
      const out = data.players.map((p) => {
        let points = 0,
          solved = 0;
        for (const e of p.r) {
          try {
            if (data.now - e.t > 365 * 864e5) continue;
            const start = puzzleFromKey(`v1-classic-${e.k}`);
            if (!start || e.l.length !== 2 * e.n) continue;
            let st = start.state;
            for (let i = 0; i < e.l.length; i += 2) st = move(st, c, +e.l[i], +e.l[i + 1]);
            if (!won(st, c)) continue;
            const min = t.get(key(canonical(start.state, c.t)));
            if (!min || e.n < min) continue;
            points += score(min, e.n);
            solved++;
          } catch {}
        }
        return { uid: p.uid, name: p.name, points, solved };
      });
      postMessage({ verified: out, request: data.request });
      return;
    }
    if (data.type === "generate") {
      const exclude = new Set(data.exclude || []),
        choices = [],
        all = [];
      for (const [k, d] of t)
        if (String(k).startsWith("19") && d >= data.lo && d <= data.hi) {
          all.push([k, d]);
          if (!exclude.has(`v1-classic-${k}`)) choices.push([k, d]);
        }
      const pool = choices.length ? choices : all,
        [k, min] = pool[Math.floor(Math.random() * pool.length)];
      postMessage({ generated: { ...puzzleFromKey(`v1-classic-${k}`), min } });
      return;
    }
    const d = t.get(key(canonical(state, c.t)));
    let next = null;
    if (d > 0)
      next = moves(state, c).find(
        (m) => t.get(key(canonical(move(state, c, ...m), c.t))) === d - 1,
      );
    postMessage({ request, d: d ?? null, next });
  } catch (e) {
    postMessage({ request: data.request, error: e.message });
  }
};
