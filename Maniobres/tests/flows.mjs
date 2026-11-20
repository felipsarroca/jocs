// SPDX-License-Identifier: AGPL-3.0-or-later
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { CONFIGS, moves, move, key, canonical, won } from "../src/engine.js";
const { chromium } = await import(
  pathToFileURL(
    resolve(
      process.env.LOCALAPPDATA,
      "maniobres-test-tools/node_modules/playwright/index.mjs",
    ),
  )
);
const browser = await chromium.launch({ channel: "chrome" }),
  context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
  }),
  page = await context.newPage(),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
// El tutorial s’obre sol el primer cop; les proves el donen per vist.
await page.addInitScript(() => localStorage.setItem("maniobres-seen-tutorial", "true"));
const base = process.env.TEST_URL || "http://127.0.0.1:4173/";
await page.goto(base + "?p=mini-0");
await page.locator('[data-action="hint"]:not(:disabled)').waitFor();
const initial = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("maniobres-game")),
  ),
  c = CONFIGS[0],
  buf = readFileSync("data/mini.bin"),
  table = new Map();
for (let i = 0; i < buf.length; i += 9)
  table.set(buf.readDoubleLE(i), buf[i + 8]);
await page.keyboard.press("a");
await page.keyboard.press("3"); // illegal in mini, must not poison undo history
let s = initial.state;
const first = moves(s, c)[0];
await page.locator(`[data-via="${first[0]}"]`).last().click();
await page.locator(`button[data-cut="${first[1]}"]`).click();
await page.locator('[data-action="undo"]').click();
assert.deepEqual(
  await page.evaluate(
    () => JSON.parse(localStorage.getItem("maniobres-game")).state,
  ),
  s,
);
let step = 0;
while (!won(s, c)) {
  const d = table.get(key(canonical(s, c.t))),
    m = moves(s, c).find(
      (m) => table.get(key(canonical(move(s, c, ...m), c.t))) === d - 1,
    );
  await page.locator(`[data-via="${m[0]}"]`).last().click();
  // Alterna els botons i tocar directament el vagó o la locomotora al tauler.
  await page
    .locator(step++ % 2 === 0 ? `button[data-cut="${m[1]}"]` : `.board [data-cut="${m[1]}"]`)
    .click();
  s = move(s, c, ...m);
}
await page.locator(".board-wrap.complete").waitFor();
assert.equal(await page.locator("dialog[open]").count(), 0);
await page.locator("dialog[open]").waitFor();
assert.match(await page.locator("dialog h2").textContent(), /perfecta/);
await page.locator('[data-action="optimal"]').click();
await page.waitForFunction(
  () => JSON.parse(localStorage.getItem("maniobres-game")).finished,
);
assert.equal(
  (
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("maniobres-game")),
    )
  ).hints,
  1,
);
await page.locator('[data-action="new"]').last().click();
await page.waitForFunction(() =>
  JSON.parse(localStorage.getItem("maniobres-game")).id.startsWith("v1-"),
);
await page.locator('[data-action="hint"]:not(:disabled)').waitFor();
let generated = await page.evaluate(() =>
  JSON.parse(localStorage.getItem("maniobres-game")),
);
assert.ok(generated.min >= 2 && generated.min <= 8);
await page.goto(base + "?p=" + generated.id);
await page.locator('[data-action="hint"]:not(:disabled)').waitFor();
assert.deepEqual(
  (
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("maniobres-game")),
    )
  ).state,
  generated.state,
);
await page.evaluate(() => (window.print = () => {}));
await page.locator('[data-action="print"]').click();
assert.equal(await page.locator(".print-sheet .qr svg").count(), 1);
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: "docs/fitxa-exemple.pdf",
  format: "A4",
  printBackground: true,
});
await page.emulateMedia({ media: "screen" });
await page.evaluate(async () => {
  await navigator.serviceWorker.ready;
});
await page.waitForFunction(() => !!navigator.serviceWorker.controller);
await context.setOffline(true);
await page.reload();
await page.locator('[data-action="hint"]:not(:disabled)').waitFor();
await page.locator('[data-nav="campaign"]').click();
assert.equal(await page.locator("[data-level]").count(), 60);
await context.setOffline(false);
await page.evaluate(() =>
  localStorage.setItem(
    "maniobres-game",
    '{"state":[[999]],"config":"classic"}',
  ),
);
await page.goto(base);
await page.locator('[data-action="hint"]:not(:disabled)').waitFor();
// Arrossegar: endur-se, intent no permès i deixar.
await page.goto(base + "?p=mini-0");
await page.locator('[data-action="hint"]:not(:disabled)').waitFor();
const gameState = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem("maniobres-game")).state);
const middle = async (sel) => {
  const r = await page.locator(sel).boundingBox();
  return [r.x + r.width / 2, r.y + r.height / 2];
};
async function dragTo(sel, x, y) {
  const [sx, sy] = await middle(sel);
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++)
    await page.mouse.move(sx + ((x - sx) * i) / 10, sy + ((y - sy) * i) / 10);
  await page.mouse.up();
  await page.waitForTimeout(400);
}
const [mx, my] = await middle(".board .maniobra-halo"),
  [vcx, vcy] = await middle('.siding[data-via="3"] .track-halo');
await dragTo('[data-src="2"][data-idx="0"]', mx - 60, my);
assert.deepEqual(await gameState(), [[1], [2, 3], [4], [5]]);
await dragTo('[data-src="1"][data-idx="0"]', vcx, vcy);
assert.deepEqual(await gameState(), [[1], [2, 3], [4], [5]]);
await dragTo('[data-src="0"][data-idx="0"]', vcx, vcy);
assert.deepEqual(await gameState(), [[], [2, 3], [4], [1, 5]]);
console.log(
  "PASS: drag take / rejected / leave.",
);
console.log(
  "PASS: invalid move + undo, win, optimal replay, generated puzzle links, printable QR, offline reload, 60 campaign levels, corrupt storage recovery.",
);
assert.deepEqual(errors, []);
await browser.close();
