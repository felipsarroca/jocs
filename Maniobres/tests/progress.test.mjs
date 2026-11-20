// SPDX-License-Identifier: AGPL-3.0-or-later
import test from "node:test";
import assert from "node:assert/strict";
import { emptyProgress, record, rating, streak, title, visit } from "../src/progress.js";

test("A hint removes one possible star, never below one", () => {
  assert.equal(rating(10, 10, 0), 3);
  assert.equal(rating(10, 10, 1), 2);
  assert.equal(rating(12, 10, 0), 2);
  assert.equal(rating(13, 10, 2), 1);
});

test("Daily streak allows one missed day per week", () => {
  assert.equal(streak(["2026-11-18", "2026-11-19", "2026-11-20"], "2026-11-20"), 3);
  assert.equal(streak(["2026-11-18", "2026-11-19"], "2026-11-20"), 2);
  assert.equal(streak(["2026-11-16", "2026-11-17", "2026-11-19", "2026-11-20"], "2026-11-20"), 4);
  assert.equal(streak(["2026-11-14", "2026-11-16", "2026-11-18", "2026-11-19", "2026-11-20"], "2026-11-20"), 4);
  assert.equal(streak(["2026-11-17"], "2026-11-20"), 0);
});

test("Titles follow experience thresholds", () => {
  assert.equal(title(0).name, "Aprenent de maniobres");
  assert.equal(title(320).name, "Maquinista");
  assert.equal(title(5000).to, null);
});

test("Records, personal bests and achievements", () => {
  const p = emptyProgress();
  let o = record(p, { id: "x", config: "classic", mode: "free", min: 17, moves: 19, hints: 0, undos: 0, seconds: 90 });
  assert.deepEqual(o.unlocked.sort(), ["disset", "expert", "primer", "sensedesfer"].sort());
  o = record(p, { id: "x", config: "classic", mode: "free", min: 17, moves: 17, hints: 0, undos: 1, seconds: 90 });
  assert.ok(o.improved);
  assert.equal(o.previous, 19);
  assert.deepEqual(o.unlocked.sort(), ["mestre", "perfecte"]);
  for (const m of ["free", "daily", "campaign", "lab"]) visit(p, m);
  assert.ok(!p.ach.explorador);
  assert.deepEqual(visit(p, "sprint"), ["explorador"]);
});
