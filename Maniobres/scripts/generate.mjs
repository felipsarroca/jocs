// SPDX-License-Identifier: AGPL-3.0-or-later
import { CONFIGS, solveTable, key, rng } from "../src/engine.js";
import { writeFileSync } from "node:fs";
const catalog = [],
  stats = [];
for (const c of CONFIGS) {
  const { dist, states } = solveTable(c);
  const bin = Buffer.alloc(dist.size * 9);
  let i = 0;
  for (const [k, d] of dist) {
    bin.writeDoubleLE(k, i);
    bin[i + 8] = d;
    i += 9;
  }
  writeFileSync(`data/${c.id}.bin`, bin);
  const initial = states.filter((s) => !s[0].length);
  const hist = {};
  for (const s of initial) {
    const d = dist.get(key(s));
    hist[d] = (hist[d] || 0) + 1;
  }
  const candidates = initial.filter((s) => dist.get(key(s)) >= 2),
    r = rng(431);
  for (let j = candidates.length - 1; j > 0; j--) {
    const k = Math.floor(r() * (j + 1));
    [candidates[j], candidates[k]] = [candidates[k], candidates[j]];
  }
  const selected = [];
  for (let d = 2; d <= Math.max(...Object.keys(hist).map(Number)); d++)
    selected.push(
      ...candidates
        .filter((s) => dist.get(key(s)) === d)
        .slice(0, c.id === "classic" ? 24 : 6),
    );
  selected.forEach((s, j) => {
    let z = c.t;
    catalog.push({
      id: `${c.id}-${j}`,
      config: c.id,
      min: dist.get(key(s)),
      state: s.map((a) => a.map((w) => w || ++z)),
    });
  });
  let distributions = 0;
  for (let a = 0; a <= c.caps[0]; a++)
    for (let b = 0; b <= c.caps[1]; b++)
      for (let cc = 0; cc <= c.caps[2]; cc++)
        if (a + b + cc === c.n) distributions++;
  const fact = (n) => (n < 2 ? 1 : n * fact(n - 1));
  const total = (distributions * fact(c.n)) / fact(c.n - c.t);
  const st = {
    id: c.id,
    states: dist.size,
    initial: initial.length,
    total,
    solvable: initial.length / total,
    max: Math.max(...Object.keys(hist).map(Number)),
    mean: initial.reduce((a, s) => a + dist.get(key(s)), 0) / initial.length,
    hist,
  };
  stats.push(st);
  console.log(st.id, st.states, st.max, st.mean);
}
writeFileSync("data/catalog.json", JSON.stringify(catalog));
writeFileSync("data/stats.json", JSON.stringify(stats, null, 2));
