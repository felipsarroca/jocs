const CACHE_NAME = 'simon-game-cache-v1';
const urlsToCache = [
  '/',
  'index.html',
  'styles.css',
  'app.js',
  'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap',
  'CC_BY-NC-SA.svg',
  'assets/icon-192.png',
  'assets/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
