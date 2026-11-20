// SPDX-License-Identifier: AGPL-3.0-or-later
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CONFIGS,
  canonical,
  key,
  move,
  moves,
  won,
  daily,
  dateKey,
} from "../src/engine.js";
const catalog = JSON.parse(readFileSync("data/catalog.json")),
  url = "https://zcwsqrgxoxvjbvpulroq.supabase.co/functions/v1/maniobres";
const tokens = Array.from(
  { length: 3 },
  () => crypto.randomUUID() + crypto.randomUUID(),
);
async function call(action, data = {}) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...data }),
  });
  return { status: r.status, ...(await r.json()) };
}
const p = daily(catalog),
  c = CONFIGS.find((c) => c.id === p.config),
  b = readFileSync(`data/${c.id}.bin`),
  t = new Map();
for (let i = 0; i < b.length; i += 9) t.set(b.readDoubleLE(i), b[i + 8]);
let s = p.state,
  log = [];
while (!won(s, c)) {
  const d = t.get(key(canonical(s, c.t))),
    m = moves(s, c).find(
      (m) => t.get(key(canonical(move(s, c, ...m), c.t))) === d - 1,
    );
  s = move(s, c, ...m);
  log.push(m);
}
try {
  assert.equal((await call("health")).ok, true);
  assert.equal(
    (
      await call("submit", {
        token: tokens[0],
        day: dateKey(),
        puzzle: p.id,
        log: [[5, 99]],
        seconds: 30,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await call("submit", {
        token: tokens[0],
        day: "2020-01-01",
        puzzle: p.id,
        log,
        seconds: 30,
      })
    ).status,
    400,
  );
  for (let i = 0; i < 3; i++) {
    const prefix = [];
    for (let j = 0; j < i; j++) {
      const m = moves(p.state, c)[0];
      prefix.push(m, [m[0], p.state[0].length]);
    }
    const r = await call("submit", {
      token: tokens[i],
      day: dateKey(),
      puzzle: p.id,
      log: [...prefix, ...log],
      seconds: 60,
    });
    assert.equal(r.status, 200);
    assert.equal(r.points, 100 - i * 10);
  }
  let rank = await call("board", { scope: "daily", token: tokens[0] });
  assert.ok(rank.rows.some((r) => r.me && r.points === 100));
  assert.ok(rank.rows.every((r) => !("actor_hash" in r) && !("log" in r)));
  await call("submit", {
    token: tokens[0],
    day: dateKey(),
    puzzle: p.id,
    log,
    seconds: 60,
  });
  rank = await call("board", { scope: "season", token: tokens[0] });
  assert.equal(rank.rows.find((r) => r.me).games, 1);
  const room = await call("create-room", { token: tokens[0], puzzle: p.id });
  assert.equal(room.status, 200);
  assert.equal((await call("room", { room: room.code })).puzzle, p.id);
  assert.equal(
    (await call("delete-room", { token: tokens[1], room: room.code })).status,
    403,
  );
  assert.equal(
    (
      await call("submit", {
        token: tokens[1],
        room: room.code,
        day: dateKey(),
        puzzle: p.id,
        log,
        seconds: 90,
      })
    ).status,
    200,
  );
  assert.equal(
    (await call("export", { token: tokens[0], room: room.code })).rows.length,
    1,
  );
  assert.equal(
    (await call("delete-room", { token: tokens[0], room: room.code })).ok,
    true,
  );
  assert.equal((await call("room", { room: room.code })).status, 400);
  console.log(
    "PASS: replay validation, current day, scoring, best-only submission, rankings, private room, owner authorization, export, deletion.",
  );
  // Screenshots contain temporary automated-test entrants, never production seed data.
  if (process.env.CAPTURE_RANK) {
    const { pathToFileURL } = await import("node:url"),
      { resolve } = await import("node:path");
    const { chromium } = await import(
      pathToFileURL(
        resolve(
          process.env.LOCALAPPDATA,
          "maniobres-test-tools/node_modules/playwright/index.mjs",
        ),
      )
    );
    const browser = await chromium.launch({ channel: "chrome" }),
      page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
    await page.goto("http://127.0.0.1:4173/");
    await page.locator('[data-nav="ranking"]').click();
    await page.locator(".podium-card").first().waitFor();
    await page.screenshot({
      path: "docs/screenshots/ranquing-prova.png",
      fullPage: true,
    });
    await browser.close();
  }
} finally {
  for (const token of tokens) {
    const r = await call("erase", { token });
    assert.equal(r.ok, true);
  }
  console.log("Temporary test players and scores deleted.");
}
