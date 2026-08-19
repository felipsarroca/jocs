import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const port = Number(process.env.TANTRIX_PAGES_TEST_PORT || 4185);
const repositoryRoot = path.resolve(import.meta.dirname, "..", "..");
const cachedChromium = path.join(process.env.LOCALAPPDATA || "", "ms-playwright", "chromium-1217", "chrome-win64", "chrome.exe");
const server = spawn("python", ["-m", "http.server", String(port), "--bind", "127.0.0.1"], {
  cwd: repositoryRoot,
  stdio: "ignore",
  windowsHide: true
});

let browser;
try {
  const appUrl = `http://127.0.0.1:${port}/Tantrix/`;
  await waitUntilReady(appUrl);
  browser = await chromium.launch(existsSync(cachedChromium) ? { executablePath: cachedChromium } : {});
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const failures = [];
  page.on("response", response => {
    if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`);
  });

  await page.goto(`${appUrl}?publish-check=1`, { waitUntil: "networkidle" });
  if (await page.title() !== "Tantrix Discovery") throw new Error("Títol incorrecte.");
  if (!await page.getByRole("heading", { name: "Cada circuit obre el següent." }).isVisible()) throw new Error("La portada no és visible.");

  const manifestHref = await page.locator('link[rel="manifest"]').getAttribute("href");
  const manifestUrl = new URL(manifestHref, page.url()).href;
  const manifestResponse = await page.request.get(manifestUrl);
  if (!manifestResponse.ok()) throw new Error("El manifest no és accessible.");
  const manifest = await manifestResponse.json();
  if (new URL(manifest.start_url, manifestUrl).href !== appUrl) throw new Error("El manifest no torna a l’arrel de Tantrix.");
  for (const icon of manifest.icons) {
    const iconResponse = await page.request.get(new URL(icon.src, manifestUrl).href);
    if (!iconResponse.ok()) throw new Error(`Icona inaccessible: ${icon.src}`);
  }

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  if (!await page.getByText("Tantrix Discovery", { exact: true }).isVisible()) throw new Error("Tantrix no apareix al catàleg mare.");
  if (failures.length) throw new Error(`Respostes fallides: ${failures.join(", ")}`);
  console.log("GitHub Pages sota /Tantrix/: correcte");
} finally {
  if (browser) await browser.close();
  server.kill();
}

async function waitUntilReady(url) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error("El servidor estàtic no ha arrencat.");
}
