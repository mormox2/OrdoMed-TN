const CACHE_NAME = 'ordomed-tn-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json'
];

// Install Event: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: network first, fallback to cache for pages/assets
self.addEventListener('fetch', (event) => {
  // Do not intercept non-GET requests
  if (event.request.method !== 'GET' ||
      event.request.url.includes('/api/') ||
      event.request.url.includes('qrserver.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If successful, clone and cache for next offline use
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network is unavailable
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If a page navigation fails, return the cached index.html
          if (event.request.mode === 'navigate') {
            return caches.match('/');
          }
        });
      })
  );
});
