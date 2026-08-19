import { existsSync } from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";
import { preview } from "vite";

const port = 4181;
const cachedChromium = path.join(process.env.LOCALAPPDATA || "", "ms-playwright", "chromium-1217", "chrome-win64", "chrome.exe");
const server = await preview({ preview: { host: "127.0.0.1", port, strictPort: true } });
const browser = await chromium.launch(existsSync(cachedChromium) ? { executablePath: cachedChromium } : {});

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => "serviceWorker" in navigator);
  await navigatorServiceWorkerReady(page);
  await page.reload({ waitUntil: "networkidle" });
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#app").waitFor({ state: "visible" });
  const title = await page.title();
  const heading = await page.getByRole("heading", { name: "Cada circuit obre el següent." }).isVisible();
  if (title !== "Tantrix Discovery" || !heading) throw new Error("La PWA no ha arrencat correctament sense connexió.");
  console.log("PWA offline: correcte");
  await context.close();
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}

async function navigatorServiceWorkerReady(page) {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise(resolve => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
    }
  });
}
