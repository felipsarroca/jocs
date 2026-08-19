import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const fixtures = JSON.parse(readFileSync(new URL("../fixtures/solutions.json", import.meta.url), "utf8"));

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: document.documentElement.clientWidth,
    bodyWidth: document.body.scrollWidth,
    offenders: [...document.querySelectorAll("body *")]
      .filter(element => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .slice(0, 8)
      .map(element => ({ tag: element.tagName, className: element.className?.baseVal || element.className || "", right: Math.round(element.getBoundingClientRect().right), width: Math.round(element.getBoundingClientRect().width), text: element.textContent?.trim().slice(0, 40) }))
  }));
  expect(overflow.documentWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewportWidth + 1);
  expect(overflow.bodyWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.viewportWidth + 1);
}

async function dragBetween(page, source, target) {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  expect(from).not.toBeNull();
  expect(to).not.toBeNull();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();
}

test("flux complet local-first, progressió i rànquing", async ({ page }, testInfo) => {
  const errors = [];
  const playerName = `Pro ${testInfo.project.name}`;
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/?test=1");
  await expect(page.getByRole("heading", { name: "Cada circuit obre el següent." })).toBeVisible();
  await assertNoOverflow(page);

  await page.getByLabel("Nom d’usuari").fill(playerName);
  await page.getByRole("button", { name: "Comença" }).click();
  await expect(page.getByRole("heading", { name: "Selecciona" })).toBeVisible();
  await page.getByRole("button", { name: "Omet el tutorial" }).click();
  await expect(page.getByRole("heading", { name: "El teu recorregut" })).toBeVisible();
  await expect(page.locator(".challenge-node")).toHaveCount(10);
  await expect(page.locator("button.challenge-node")).toHaveCount(1);
  await expect(page.locator(".challenge-node.is-current")).toHaveCount(1);
  await expect(page.locator(".challenge-node.is-locked")).toHaveCount(9);
  await expect(page.locator(".challenge-node.is-complete")).toHaveCount(0);
  await expect(page.locator(".challenge-node .challenge-state")).toHaveCount(10);
  await expect(page.locator(".challenge-node .challenge-state svg")).toHaveCount(10);
  await expect(page.locator(".challenge-node .challenge-state")).toHaveText(Array(10).fill(""));
  expect(await page.locator(".challenge-node").evaluateAll(nodes => nodes.every(node => {
    const card = node.getBoundingClientRect();
    const badge = node.querySelector(".challenge-state").getBoundingClientRect();
    return badge.top - card.top <= 9 && card.right - badge.right <= 9;
  }))).toBe(true);
  await expect(page.getByRole("button", { name: "Ves a la portada d’accés", exact: true })).toBeVisible();
  await assertNoOverflow(page);

  await page.locator('.quick-actions button[data-action="settings"]').click();
  await expect(page.getByRole("heading", { name: "Desat del progrés", level: 3 })).toBeVisible();
  await expect(page.getByText(/se sincronitzen automàticament en segon pla/i)).toBeVisible();
  await expect(page.locator('input[type="url"], iframe, a[href*="script.google.com"]')).toHaveCount(0);
  await expect(page.getByText(/URL d’Apps Script|Connexió amb Google Sheets|script\.google\.com/i)).toHaveCount(0);
  await page.getByRole("button", { name: "Torna al menú", exact: true }).click();
  await expect(page.getByRole("heading", { name: "El teu recorregut" })).toBeVisible();
  await page.getByRole("button", { name: "Ves a la portada d’accés", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Cada circuit obre el següent." })).toBeVisible();
  await page.getByLabel("Nom d’usuari").fill(playerName);
  await page.getByRole("button", { name: "Comença" }).click();
  await expect(page.getByRole("heading", { name: "El teu recorregut" })).toBeVisible();

  await page.getByRole("button", { name: /Comença el Discovery/ }).click();
  const objective = page.getByLabel("Objectiu del repte");
  await expect(objective.getByText("Fitxes", { exact: true })).toBeVisible();
  await expect(objective.getByText("Color", { exact: true })).toBeVisible();
  await expect(page.getByText("groc", { exact: true })).toBeVisible();
  await expect(page.locator(".tray-tile")).toHaveCount(3);
  await expect(page.getByText(/Pista/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Surt de la partida" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Comprova", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Allunya", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Centra", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Apropa", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Comprova", exact: true }).click();
  await expect(page.locator("#game-status")).toHaveText("Falten col·locar 3 fitxes.");
  await assertNoOverflow(page);

  const centerCell = page.locator('.board-cell[data-q="0"][data-r="0"]');
  await dragBetween(page, page.locator(".tray-tile").first(), centerCell);
  await expect(page.locator("#board-tiles [data-positioned-tile]")).toHaveCount(1);
  await page.getByRole("button", { name: "Surt de la partida" }).click();
  await expect(page.getByRole("heading", { name: "El teu recorregut" })).toBeVisible();
  await page.locator('button[data-action="continue"]').click();
  await expect(page.locator("#board-tiles [data-positioned-tile]")).toHaveCount(1);

  const draggedTileId = await page.evaluate(() => window.__tantrixTest.getState().game.boardLayout()[0].tileId);
  const boardTile = page.locator(`[data-positioned-tile="${draggedTileId}"] [data-tile-id]`);
  await boardTile.focus();
  await page.keyboard.press("q");
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => page.evaluate(() => window.__tantrixTest.getState().game.boardLayout()[0])).toMatchObject({ q: 1, r: 0 });

  await dragBetween(page, page.locator(`[data-positioned-tile="${draggedTileId}"]`), page.getByLabel("Fitxes i accions"));
  await expect(page.locator("#board-tiles [data-positioned-tile]")).toHaveCount(0);

  await page.locator(".tray-tile").first().click();
  await centerCell.click();
  await expect(page.locator("#board-tiles [data-positioned-tile]")).toHaveCount(1);
  await page.evaluate(layout => window.__tantrixTest.stageLayout(layout), fixtures.D03_Y);
  await expect(page.locator("#board-tiles [data-positioned-tile]")).toHaveCount(3);
  await page.getByRole("button", { name: "Comprova", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Repte superat!" })).toBeVisible();
  await expect(page.getByText("Ja has desbloquejat")).toBeVisible();
  await expect(page.getByText("Repte 2: 4 fitxes · vermell")).toBeVisible();
  await expect(page.getByRole("button", { name: "Següent repte", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Inici", exact: true }).click();
  await expect(page.getByText("1/10", { exact: true })).toBeVisible();
  await expect(page.locator(".challenge-node.is-complete")).toHaveCount(1);
  await expect(page.locator(".challenge-node.is-current")).toHaveCount(1);
  await expect(page.locator(".challenge-node.is-locked")).toHaveCount(8);
  await expect(page.locator("button.challenge-node")).toHaveCount(1);

  await page.reload();
  await expect(page.getByRole("heading", { name: "El teu recorregut" })).toBeVisible();
  await expect(page.getByText("1/10", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Rànquing" }).click();
  await expect(page.getByRole("heading", { name: "1 nivell superat", level: 3 })).toBeVisible();
  await expect(page.locator(".ranking-players li")).toContainText(`Pro ${testInfo.project.name}`);
  await expect(page.locator(".ranking-medallion")).toHaveCount(1);
  await expect(page.locator("table, iframe")).toHaveCount(0);
  await expect(page.getByText(/Google Sheets/i)).toHaveCount(0);
  await assertNoOverflow(page);

  await expect(page.locator("footer.app-footer p")).toHaveCount(2);
  await expect(page.locator("footer.app-footer img")).toHaveAttribute("alt", "Creative Commons BY-NC-SA 4.0");
  await expect(page.locator("footer.app-footer img")).toHaveAttribute("src", /cc-by-nc-sa\.svg$/);
  await expect(page.locator("footer.app-footer")).toContainText("Creada per Felip Sarroca amb assistència d’IA");
  await expect(page.locator("footer.app-footer")).toContainText("Obra sota llicència CC BY-NC-SA 4.0");
  await expect.poll(() => page.locator("footer.app-footer a").evaluateAll(links => links.every(link => getComputedStyle(link).textDecorationLine === "none"))).toBe(true);
  expect(errors).toEqual([]);
});

test("les deu fitxes exposen tres connexions exactes i circulars", async ({ page }) => {
  await page.goto("/?test=1");
  const proof = await page.evaluate(async () => {
    const { TILE_DEFINITIONS } = await import("/src/data/tiles.js");
    const { createTileSvg } = await import("/src/render/tile-renderer.js");
    return TILE_DEFINITIONS.map(tile => {
      const svg = createTileSvg(tile.id, { decorative: true });
      return {
        id: tile.id,
        colors: [...svg.querySelectorAll(".tile-link")].map(path => path.dataset.connectionColor),
        shapes: [...svg.querySelectorAll(".tile-link")].map(path => path.dataset.connectionShape),
        paths: [...svg.querySelectorAll(".tile-link")].map(path => path.getAttribute("d"))
      };
    });
  });
  expect(proof).toHaveLength(10);
  for (const tile of proof) {
    expect(tile.colors.sort()).toEqual(["B", "R", "Y"]);
    expect(tile.shapes).toHaveLength(3);
    expect(tile.paths.every(pathData => / [AL] /.test(pathData))).toBe(true);
  }
  expect(proof[2].shapes).toEqual(["tight", "tight", "tight"]);
  expect(proof[3].shapes).toEqual(["wide", "wide", "straight"]);
});

test("guia, configuració i zoom de text conserven el reflow", async ({ page }, testInfo) => {
  await page.goto("/?test=1");
  await page.getByLabel("Nom d’usuari").fill(`Visual ${testInfo.project.name}`);
  await page.getByRole("button", { name: "Comença" }).click();
  await page.getByRole("button", { name: "Omet el tutorial" }).click();
  await page.getByRole("button", { name: "Com es juga" }).click();
  await expect(page.locator(".guide-card")).toHaveCount(6);
  await expect(page.locator(".guide-diagram")).toHaveCount(6);
  await expect(page.locator(".guide-card[aria-label]")).toHaveCount(0);
  await expect(page.locator('.guide-visual[role="img"][aria-label]')).toHaveCount(6);
  await expect(page.locator(".guide-inline-control")).toHaveCount(3);
  await expect(page.locator(".guide-contact-ring")).toHaveCount(1);
  await expect(page.locator(".guide-loop-color")).toHaveCount(1);
  await expect(page.getByRole("button", { name: "Torna al menú", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Ves a la portada d’accés", exact: true })).toHaveCount(0);
  await assertNoOverflow(page);
  await page.addStyleTag({ content: "html{font-size:200%!important}" });
  await assertNoOverflow(page);
});

test("els deu reptes s’obren estrictament en ordre", async ({ page }, testInfo) => {
  await page.goto("/?test=1");
  await page.getByLabel("Nom d’usuari").fill(`Expert ${testInfo.project.name}`);
  await page.getByRole("button", { name: "Comença" }).click();
  await page.getByRole("button", { name: "Omet el tutorial" }).click();

  const challengeIds = Object.keys(fixtures);
  for (let index = 0; index < challengeIds.length; index += 1) {
    if (index === 0) {
      await expect(page.locator("button.challenge-node")).toHaveCount(1);
      await page.locator("button.challenge-node").click();
      await expect(page.locator(".game-progress")).toHaveText("Repte 1 de 10");
    }
    const pieceCount = fixtures[challengeIds[index]].length;
    const expectedCellCount = pieceCount <= 4 ? 19 : pieceCount <= 8 ? 37 : 61;
    await expect(page.locator(".board-cell")).toHaveCount(expectedCellCount);
    if (index === 1) {
      const colorValue = page.locator(".objective-pill").filter({ hasText: "Color" }).locator("strong");
      await expect(colorValue).toContainText("vermell");
      await expect.poll(() => colorValue.evaluate(element => {
        const value = element.getBoundingClientRect();
        const card = element.closest(".objective-pill").getBoundingClientRect();
        return value.left >= card.left - 1 && value.right <= card.right + 1;
      })).toBe(true);
      await assertNoOverflow(page);
    }
    await page.evaluate(layout => window.__tantrixTest.placeLayout(layout), fixtures[challengeIds[index]]);
    await expect(page.getByRole("heading", { name: "Repte superat!" })).toBeVisible();
    if (index < challengeIds.length - 1) {
      await page.getByRole("button", { name: "Següent repte" }).click();
      await expect(page.locator(".game-progress")).toHaveText(`Repte ${index + 2} de 10`);
    } else {
      await page.getByRole("button", { name: "Tria un repte" }).click();
      await expect(page.getByRole("heading", { name: "El teu recorregut" })).toBeVisible();
    }
  }

  await expect(page.getByText("10/10", { exact: true })).toBeVisible();
  await expect(page.locator("button.challenge-node")).toHaveCount(10);
  await expect(page.locator(".challenge-node.is-complete")).toHaveCount(10);
  await expect(page.locator(".challenge-node.is-current, .challenge-node.is-locked")).toHaveCount(0);
  await page.getByRole("button", { name: "Rànquing" }).click();
  await expect(page.getByRole("heading", { name: "Discovery completat", level: 3 })).toBeVisible();
  await assertNoOverflow(page);
});
