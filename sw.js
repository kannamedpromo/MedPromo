// MedPromo Service Worker v3.2
// IMPORTANT: Only caches app files — NEVER touches IndexedDB data
const CACHE_NAME = 'medpromo-v3.2';
const CACHE_FILES = [
  '/medpromo/',
  '/medpromo/index.html',
  '/medpromo/manifest.json',
];

// Install — cache app shell only
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_FILES).catch(() => {
        // Silently fail if some files can't be cached
        return Promise.resolve();
      });
    })
  );
  // Take control immediately without waiting
  self.skipWaiting();
});

// Activate — delete OLD caches only, NEVER touch IndexedDB
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch — network first, fall back to cache
// This ensures latest index.html always loads
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // For navigation requests (loading the app) — network first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Cache the fresh response
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(() => {
          // Offline — serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // For other requests — cache first, network fallback
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => cached);
    })
  );
});
