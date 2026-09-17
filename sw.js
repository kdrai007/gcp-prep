const CACHE_NAME = 'gcp-ace-prep-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './data.json',
  './manifest.json',
  './js/app.js',
  './js/state.js',
  './js/storage.js',
  './js/utils.js',
  './js/views/dashboard.js',
  './js/views/practice.js',
  './js/views/exam.js',
  './js/views/flashcard.js',
  './js/views/review.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Network first with fallback to cache for local assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone response and cache if valid
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
