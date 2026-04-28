const CACHE_NAME = 'kheror-khata-offline-vault-v1';

// 1. Install Phase: Cache the core files immediately
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                './',
                './index.html',
                './manifest.json',
                './icon1.png'
            ]);
        })
    );
    // Force the service worker to activate immediately
    self.skipWaiting(); 
});

self.addEventListener('activate', (e) => {
    e.waitUntil(self.clients.claim());
});

// 2. Fetch Phase: The Catch-All Net for True Offline Mode
self.addEventListener('fetch', (e) => {
    // Only intercept standard web requests
    if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            // IF IN CACHE: Serve it instantly (Zero internet required)
            if (cachedResponse) {
                return cachedResponse;
            }

            // IF NOT IN CACHE: Fetch from internet, then trap it in the cache for next time
            return fetch(e.request).then((networkResponse) => {
                // Don't cache if the network failed
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'error') {
                    return networkResponse;
                }

                // Clone the response and put it in the vault
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // If offline and the file isn't cached yet, do nothing. 
                console.log('Offline and resource not cached:', e.request.url);
            });
        })
    );
});

