import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { preview } from "vite";

const port = 4182;
const cachedChromium = path.join(process.env.LOCALAPPDATA || "", "ms-playwright", "chromium-1217", "chrome-win64", "chrome.exe");
const server = await preview({ preview: { host: "127.0.0.1", port, strictPort: true } });
const browser = await chromium.launch(existsSync(cachedChromium) ? { executablePath: cachedChromium } : {});

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.getByLabel("Nom d’usuari").fill("Connexió Remota");
  await page.getByRole("button", { name: "Comença" }).click();
  await page.getByRole("button", { name: "Omet el tutorial" }).click();
  await page.locator('.sync-chip[data-state="synced"]').waitFor({ state: "visible", timeout: 30000 });
  await page.getByRole("button", { name: "Rànquing" }).click();
  await page.getByRole("heading", { name: "Rànquing", exact: true }).waitFor({ state: "visible" });
  await page.getByRole("button", { name: "Actualitza" }).click();
  await page.getByRole("button", { name: "Actualitza" }).waitFor({ state: "visible", timeout: 30000 });
  await page.locator("#ranking-updated").filter({ hasText: "Actualitzat" }).waitFor({ state: "visible", timeout: 30000 });
  if (errors.length) throw new Error(`Errors de navegador: ${errors.join(" | ")}`);
  console.log("Connexió remota des del navegador: correcta");
  await context.close();
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
