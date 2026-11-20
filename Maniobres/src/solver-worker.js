// SPDX-License-Identifier: AGPL-3.0-or-later
import {
  canonical,
  key,
  moves,
  move,
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
