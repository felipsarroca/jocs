// SPDX-License-Identifier: AGPL-3.0-or-later
const CACHE = "maniobres-v2.1.1-1";
const FILES = [
  "./",
  "./index.html",
  "./src/app.js",
  "./src/engine.js",
  "./src/ranking.js",
  "./src/solver-worker.js",
  "./src/style.css",
  "./assets/favicon.svg",
  "./assets/license.png",
  "./manifest.webmanifest",
  "./data/catalog.json",
  "./data/mini.bin",
  "./data/classic.bin",
];
self.addEventListener("install", (event) =>
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(FILES))),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("maniobres-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (
    event.request.method !== "GET" ||
    url.origin !== location.origin ||
    !url.href.startsWith(self.registration.scope)
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      if (event.request.mode === "navigate") {
        try {
          return await fetch(event.request);
        } catch {
          return await cache.match("./index.html");
        }
      }
      const match = await cache.match(event.request);
      if (match) return match;
      return fetch(event.request);
    })(),
  );
});
