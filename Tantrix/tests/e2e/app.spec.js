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
  const settingsDone = page.getByRole("button", { name: "Fet", exact: true });
  await expect(settingsDone).toHaveClass(/settings-done-button/);
  expect(await settingsDone.evaluate(button => {
    const buttonBox = button.getBoundingClientRect();
    const content = [...button.children].map(child => child.getBoundingClientRect());
    return content.every(box => Math.abs((box.top + box.height / 2) - (buttonBox.top + buttonBox.height / 2)) <= 1);
  })).toBe(true);
  const syncNow = page.getByRole("button", { name: "Sincronitza ara", exact: true });
  await expect(syncNow.locator("svg path")).toHaveCount(4);
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
  await expect(page.getByRole("button", { name: "Desfés", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Refés", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Torna la fitxa a la safata", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Reinicia", exact: true })).toBeVisible();
  expect(await page.locator('.game-primary-actions button').evaluateAll(buttons => buttons.every(button => {
    const label = button.querySelector("span:last-child");
    return parseFloat(getComputedStyle(label).fontSize) <= parseFloat(getComputedStyle(button).fontSize) * .91;
  }))).toBe(true);
  const primaryActionGeometry = await page.locator('.game-primary-actions button').evaluateAll(buttons => buttons.map(button => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height, top: rect.top };
  }));
  expect(primaryActionGeometry).toHaveLength(2);
  expect(Math.abs(primaryActionGeometry[0].width - primaryActionGeometry[1].width)).toBeLessThanOrEqual(1);
  expect(Math.abs(primaryActionGeometry[0].height - primaryActionGeometry[1].height)).toBeLessThanOrEqual(1);
  const rotationBottom = await page.locator('.rotation-actions').evaluate(element => element.getBoundingClientRect().bottom);
  expect(primaryActionGeometry[0].top).toBeGreaterThanOrEqual(rotationBottom);
  const touchGhostSize = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.className = "tray-tile tray-drag-ghost is-touch-drag";
    document.body.append(probe);
    const rect = probe.getBoundingClientRect();
    probe.remove();
    return { width: rect.width, height: rect.height };
  });
  expect(touchGhostSize).toEqual({ width: 68, height: 68 });
  await page.getByRole("button", { name: "Comprova", exact: true }).click();
  await expect(page.locator("#game-status")).toHaveText("Falten col·locar 3 fitxes.");
  await assertNoOverflow(page);

  const centerCell = page.locator('.board-cell[data-q="0"][data-r="0"]');
  await dragBetween(page, page.locator(".tray-tile").first(), centerCell);
  await expect(page.locator("#board-tiles [data-positioned-tile]")).toHaveCount(1);
  await expect(page.locator(".board-cell.is-candidate")).toHaveCount(0);
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
  await page.evaluate(() => {
    window.__successMountCount = 0;
    window.__successObserver = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE && (node.matches?.(".success-overlay") || node.querySelector?.(".success-overlay"))) window.__successMountCount += 1;
      }
    });
    window.__successObserver.observe(document.querySelector("#app"), { childList: true, subtree: true });
  });
  await page.getByRole("button", { name: "Comprova", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Repte superat!" })).toBeVisible();
  await page.waitForTimeout(1200);
  expect(await page.evaluate(() => window.__successMountCount)).toBe(1);
  await page.evaluate(() => window.__successObserver.disconnect());
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
  await expect(page.locator(".ranking-own-progress p")).toHaveCount(0);
  await expect(page.locator(".ranking-group-copy p, .ranking-group-copy > span")).toHaveCount(0);
  expect(await page.locator(".ranking-group-header").evaluateAll(headers => headers.every(header => {
    const card = header.getBoundingClientRect();
    const count = header.querySelector(".ranking-player-count").getBoundingClientRect();
    return card.right - count.right <= 21;
  }))).toBe(true);
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

test("el tutorial exigeix practicar selecció, gir, moviment i contacte", async ({ page }, testInfo) => {
  await page.goto("/?test=1");
  await page.getByLabel("Nom d’usuari").fill(`Tutorial ${testInfo.project.name}`);
  await page.getByRole("button", { name: "Comença" }).click();

  const next = page.locator("#tutorial-next");
  await expect(page.getByRole("heading", { name: "Selecciona una fitxa" })).toBeVisible();
  await expect(next).toBeDisabled();
  await page.getByRole("button", { name: "Selecciona la fitxa de pràctica" }).click();
  await expect(next).toBeEnabled();
  await next.click();

  await expect(page.getByRole("heading", { name: "Gira-la 60 graus" })).toBeVisible();
  await expect(next).toBeDisabled();
  await page.getByRole("button", { name: "Dreta", exact: true }).click();
  await expect(page.locator(".tutorial-angle")).toHaveText("60°");
  await expect(next).toBeEnabled();
  await next.click();

  await expect(page.getByRole("heading", { name: "Mou-la sense arrossegar" })).toBeVisible();
  await expect(next).toBeDisabled();
  await page.locator('.guide-rendered-tile[aria-label="Selecciona la fitxa de pràctica"]').click();
  await page.locator('.tutorial-move-cell[aria-label="Mou la fitxa a la cel·la verda"]').click();
  await expect(next).toBeEnabled();
  await next.click();

  await expect(page.getByRole("heading", { name: "Revisa el contacte" })).toBeVisible();
  await expect(next).toBeDisabled();
  await page.locator('[data-contact="wrong"]').click();
  await expect(page.locator("#tutorial-task")).toContainText("blau i un de vermell");
  await expect(next).toBeDisabled();
  await page.locator('[data-contact="correct"]').click();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.getByRole("heading", { name: "El teu recorregut" })).toBeVisible();
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
  await expect(page.locator(".guide-loop-guide")).toHaveCount(1);
  expect(await page.locator(".guide-visual").evaluateAll(visuals => visuals.map(visual => visual.querySelectorAll(".guide-rendered-tile").length))).toEqual([1, 2, 1, 3, 4, 12]);
  await expect(page.locator(".guide-schematic-tiles, .guide-hole-shape, .guide-compact-shape")).toHaveCount(0);
  expect(await page.locator('[data-guide-visual="1"] .guide-rendered-tile').evaluateAll(tiles => {
    const matrices = tiles.map(tile => tile.transform.baseVal.consolidate().matrix);
    const distance = Math.hypot(matrices[1].e - matrices[0].e, matrices[1].f - matrices[0].f);
    return Math.abs(distance - 54 * Math.sqrt(3) * matrices[0].a) < .1;
  })).toBe(true);
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
