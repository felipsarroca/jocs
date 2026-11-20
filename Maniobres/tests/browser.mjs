// SPDX-License-Identifier: AGPL-3.0-or-later
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { mkdirSync } from "node:fs";
const pw = process.env.LOCALAPPDATA
  ? pathToFileURL(
      resolve(
        process.env.LOCALAPPDATA,
        "maniobres-test-tools/node_modules/playwright/index.mjs",
      ),
    ).href
  : "playwright";
const { chromium } = await import(pw);
const browser = await chromium.launch({ channel: "chrome", headless: true });
mkdirSync("docs/screenshots", { recursive: true });
const errors = [];
const page = await browser.newPage({
  viewport: { width: 1366, height: 768 },
  deviceScaleFactor: 1,
});
page.on("pageerror", (e) => errors.push(e.message));
// El tutorial s’obre sol el primer cop; les proves el donen per vist.
await page.addInitScript(() => localStorage.setItem("maniobres-seen-tutorial", "true"));
await page.goto(process.env.TEST_URL || "http://127.0.0.1:4173/");
await page.locator('[data-action="hint"]:not(:disabled)').waitFor();
await page.screenshot({
  path: "docs/screenshots/estacio-1366.png",
  fullPage: true,
});
console.log(
  "desktop",
  await page.evaluate(() => ({
    width: innerWidth,
    doc: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
  })),
);
await page.locator('[data-via="1"]').last().click();
await page.locator("[data-cut]:not(:disabled)").first().click();
await page.locator('[data-action="undo"]').click();
for (const v of ["about", "ranking"]) {
  await page.locator(`[data-nav="${v}"]`).click();
  await page.waitForTimeout(v === "ranking" ? 1800 : 100);
  console.log("view", v, await page.locator("h1").textContent());
  if (v === "ranking")
    await page.screenshot({
      path: "docs/screenshots/ranquing.png",
      fullPage: true,
    });
}
await page.locator('[data-nav="play"]').first().click();
await page.setViewportSize({ width: 1920, height: 1080 });
await page.screenshot({
  path: "docs/screenshots/estacio-1920.png",
  fullPage: true,
});
await page.setViewportSize({ width: 1093, height: 614 });
await page.screenshot({
  path: "docs/screenshots/escala-125.png",
  fullPage: true,
});
await page.setViewportSize({ width: 911, height: 512 });
await page.screenshot({
  path: "docs/screenshots/escala-150.png",
  fullPage: true,
});
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: "docs/screenshots/mobil.png", fullPage: true });
console.log(
  "mobile",
  await page.evaluate(() => ({
    width: innerWidth,
    doc: document.documentElement.scrollWidth,
  })),
);
await page.locator('[data-action="tutorial"]').first().click();
for (let i = 0; i < 5; i++)
  await page.locator('[data-action="tutorial-next"]').click();
await page.locator('[data-action="hint"]:not(:disabled)').waitFor();
console.log("tutorial started");
console.log("errors", errors);
await browser.close();
if (errors.length) process.exitCode = 1;
