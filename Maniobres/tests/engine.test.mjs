// SPDX-License-Identifier: AGPL-3.0-or-later
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CONFIGS,
  solveTable,
  key,
  decode,
  canonical,
  moves,
  move,
  won,
  replay,
  dateKey,
  daily,
} from "../src/engine.js";
const catalog = JSON.parse(
    readFileSync(new URL("../data/catalog.json", import.meta.url)),
  ),
  stats = JSON.parse(
    readFileSync(new URL("../data/stats.json", import.meta.url)),
  );
test("Classic enumeration independently reproduces 356160 states and the published histogram", () => {
  const c = CONFIGS[2],
    { dist, states } = solveTable(c),
    hist = {};
  assert.equal(dist.size, 356160);
  for (const s of states) {
    assert.deepEqual(decode(key(s)), s);
    if (!s[0].length) {
      const n = dist.get(key(s));
      hist[n] = (hist[n] || 0) + 1;
    }
  }
  assert.equal(
    Object.values(hist).reduce((a, b) => a + b),
    67200,
  );
  assert.equal(hist[17], 32);
  assert.deepEqual(hist, stats[2].hist);
});
for (const c of CONFIGS)
  test(`${c.id}: every catalog puzzle reaches the goal in its advertised minimum`, () => {
    const b = readFileSync(new URL(`../data/${c.id}.bin`, import.meta.url)),
      t = new Map();
    for (let i = 0; i < b.length; i += 9) t.set(b.readDoubleLE(i), b[i + 8]);
    for (const p of catalog.filter((p) => p.config === c.id)) {
      let s = p.state,
        log = [];
      assert.equal(t.get(key(canonical(s, c.t))), p.min);
      while (!won(s, c)) {
        const d = t.get(key(canonical(s, c.t))),
          m = moves(s, c).find(
            (m) => t.get(key(canonical(move(s, c, ...m), c.t))) === d - 1,
          );
        assert.ok(m);
        const old = s;
        s = move(s, c, ...m);
        assert.deepEqual(move(s, c, m[0], old[0].length), old);
        assert.deepEqual(
          s.flat().sort((a, b) => a - b),
          Array.from({ length: c.n }, (_, i) => i + 1),
        );
        log.push(m);
        assert.ok(log.length <= p.min);
      }
      assert.equal(log.length, p.min);
      assert.equal(replay(p, log), true);
    }
  });
test("Illegal, malformed and capacity-breaking moves are rejected", () => {
  const s = [[], [1, 2, 3, 4, 5], [6, 7, 8], []],
    c = CONFIGS[2];
  assert.throws(() => move(s, c, 1, 4));
  assert.throws(() => move(s, c, 4, 1));
  assert.throws(() => move(s, c, 1, 1.5));
  assert.throws(() => replay(catalog[0], [[1, "2"]]));
  assert.throws(() => move([[1, 2, 3], [4, 5, 6, 7, 8], [], []], c, 1, 0));
});
test("Station entry does not require fitting the attached wagons inside the siding", () => {
  const s = [[1], [2, 3, 4, 5, 6], [7, 8], []];
  assert.deepEqual(move(s, CONFIGS[2], 1, 2), [
    [1, 2],
    [3, 4, 5, 6],
    [7, 8],
    [],
  ]);
});
test("Madrid daily puzzle changes on the local date boundary", () => {
  assert.equal(dateKey(new Date("2026-11-20T23:01:00Z")), "2026-11-21");
  assert.equal(
    daily(catalog, "2026-11-20").id,
    daily(catalog, "2026-11-20").id,
  );
});
