import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "@playwright/test";

const fixtures = JSON.parse(readFileSync(new URL("../fixtures/solutions.json", import.meta.url), "utf8"));

test("captures de revisió visual", async ({ page }, testInfo) => {
  const output = path.resolve("qa", "screenshots", testInfo.project.name);
  mkdirSync(output, { recursive: true });
  await page.goto("/?test=1");
  await page.screenshot({ path: path.join(output, "01-identificacio.png"), fullPage: true });
  await page.getByLabel("Nom d’usuari").fill(`Visual ${testInfo.project.name}`);
  await page.getByRole("button", { name: "Comença" }).click();
  await page.getByRole("button", { name: "Omet el tutorial" }).click();
  await page.screenshot({ path: path.join(output, "02-inici.png"), fullPage: true });
  await page.getByRole("button", { name: "Com es juga" }).click();
  await page.screenshot({ path: path.join(output, "11-com-es-juga.png"), fullPage: true });
  await page.getByRole("button", { name: "Torna al menú", exact: true }).click();
  await page.locator('.quick-actions button[data-action="settings"]').click();
  await page.screenshot({ path: path.join(output, "07-configuracio.png"), fullPage: true });
  await page.getByRole("button", { name: "Fet" }).click();
  await page.locator("button.challenge-node").click();
  await page.screenshot({ path: path.join(output, "03-joc.png"), fullPage: true });
  await page.evaluate(layout => window.__tantrixTest.stageLayout(layout), fixtures.D03_Y);
  await page.getByRole("button", { name: "Comprova", exact: true }).click();
  await page.getByRole("heading", { name: "Repte superat!" }).waitFor();
  await page.screenshot({ path: path.join(output, "05-repte-superat.png"), fullPage: true });
  await page.getByRole("button", { name: "Següent repte", exact: true }).click();
  await page.screenshot({ path: path.join(output, "08-joc-vermell.png"), fullPage: true });
  await page.evaluate(() => window.__tantrixTest.openChallenge("D10_Y"));
  await page.screenshot({ path: path.join(output, "09-joc-10-fitxes.png"), fullPage: true });
  await page.getByRole("button", { name: "Surt de la partida", exact: true }).click();
  await page.screenshot({ path: path.join(output, "10-inici-estats.png"), fullPage: true });
  await page.evaluate(() => {
    const state = window.__tantrixTest.getState();
    state.ranking = [
      { displayName: "Ariadna", normalizedName: "ariadna", completedChallengeCount: 10 },
      { displayName: "Biel", normalizedName: "biel", completedChallengeCount: 10 },
      { displayName: "Carla", normalizedName: "carla", completedChallengeCount: 7 },
      { displayName: "Dídac", normalizedName: "dídac", completedChallengeCount: 2 },
      { displayName: state.player.displayName, normalizedName: state.player.normalizedName, completedChallengeCount: 1 }
    ];
  });
  await page.getByRole("button", { name: "Rànquing" }).click();
  await page.screenshot({ path: path.join(output, "06-ranquing.png"), fullPage: true });
});

test("catàleg visual de les deu fitxes exactes", async ({ page }, testInfo) => {
  const output = path.resolve("qa", "screenshots", testInfo.project.name);
  mkdirSync(output, { recursive: true });
  await page.goto("/?test=1");
  await page.evaluate(async () => {
    const { createTileSvg } = await import("/src/render/tile-renderer.js");
    document.body.innerHTML = `<main class="tile-proof"><h1>Les 10 fitxes Discovery</h1><div id="tile-proof-grid"></div></main>`;
    const grid = document.querySelector("#tile-proof-grid");
    for (let tileId = 1; tileId <= 10; tileId += 1) {
      const figure = document.createElement("figure");
      figure.append(createTileSvg(tileId, { size: 170, decorative: true }));
      const caption = document.createElement("figcaption");
      caption.textContent = `Fitxa ${tileId}`;
      figure.append(caption);
      grid.append(figure);
    }
    const style = document.createElement("style");
    style.textContent = `.tile-proof{min-height:100vh;padding:32px;background:#f3eee2}.tile-proof h1{font-size:clamp(2rem,5vw,4rem);margin:0 0 28px}.tile-proof #tile-proof-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:20px}.tile-proof figure{margin:0;min-height:210px;display:grid;place-items:center;padding:14px;border:1px solid #d9d1c3;border-radius:20px;background:#fffdf8}.tile-proof figcaption{font-weight:800}`;
    document.head.append(style);
  });
  await page.locator(".tantrix-tile").first().waitFor();
  await page.screenshot({ path: path.join(output, "04-fitxes.png"), fullPage: true });
});
