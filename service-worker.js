const CACHE_NAME = 'gemini-genesis-v8-cache-v2'; // Incremented cache version
const urlsToCache = [
  '/',
  '/index.html',
  '/offline.html',
  // Add main app icons to cache for PWA installation
  '/logo192.png',
  '/logo512.png'
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

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Stale-while-revalidate strategy function
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request).then(networkResponse => {
        // Check if we received a valid response
        if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(err => {
        // Network failed, we can ignore this if we have a cached response
        console.warn(`Fetch failed for ${request.url}; using cache if available.`, err);
    });

    return cachedResponse || fetchPromise;
}

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Use network-first for navigation requests to get the latest app version.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request)) // Fallback to cache
        .catch(() => caches.match('/offline.html')) // Fallback to offline page
    );
    return;
  }

  // For CDN assets and Pexels images, use Stale-While-Revalidate for performance.
  const isCdnAsset = url.hostname === 'aistudiocdn.com' || 
                     url.hostname.includes('pexels.com') || 
                     url.hostname.includes('googleapis.com') || 
                     url.hostname.includes('gstatic.com') ||
                     url.hostname.includes('cdnjs.cloudflare.com');

  if (isCdnAsset) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // For other requests (like local assets), use Cache-first.
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request);
    })
  );
});