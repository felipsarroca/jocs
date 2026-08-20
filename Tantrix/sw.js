const CACHE_NAME = "tantrix-discovery-v1.3.0";
const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/manifest.webmanifest",
  "./assets/app.js",
  "./assets/app.css",
  "./assets/favicon.svg",
  "./assets/cc-by-nc-sa.svg",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map(async url => {
      const response = await fetch(url, { cache: "reload" });
      if (!response.ok) throw new Error(`No s’ha pogut precarregar ${url}`);
      await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const staleCaches = keys.filter(key => key.startsWith("tantrix-discovery-") && key !== CACHE_NAME);
    await Promise.all(staleCaches.map(key => caches.delete(key)));
    await self.clients.claim();
    if (staleCaches.length) {
      const windows = await self.clients.matchAll({ type: "window" });
      await Promise.all(windows.map(client => client.navigate(client.url)));
    }
  })());
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
        return response;
      })
      .catch(() => caches.match("./index.html")));
    return;
  }
  const pathname = new URL(event.request.url).pathname;
  if (pathname.endsWith("/assets/app.js") || pathname.endsWith("/assets/app.css")) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  })));
});
