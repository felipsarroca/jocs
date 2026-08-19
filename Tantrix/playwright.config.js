import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";
import path from "node:path";

const cachedChromium = path.join(process.env.LOCALAPPDATA || "", "ms-playwright", "chromium-1217", "chrome-win64", "chrome.exe");
const testPort = Number(process.env.TANTRIX_TEST_PORT || 4179);
const testBaseUrl = `http://127.0.0.1:${testPort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: testBaseUrl,
    locale: "ca-ES",
    colorScheme: "light",
    launchOptions: existsSync(cachedChromium) ? { executablePath: cachedChromium } : {},
    screenshot: "only-on-failure",
    trace: "retain-on-failure"
  },
  projects: [
    { name: "small-mobile", use: { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true } },
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "tablet", use: { viewport: { width: 820, height: 1180 }, hasTouch: true } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
    { name: "landscape", use: { viewport: { width: 932, height: 430 }, hasTouch: true } }
  ],
  webServer: {
    command: `npm run dev -- --port ${testPort}`,
    url: testBaseUrl,
    reuseExistingServer: true,
    timeout: 60000
  }
});
