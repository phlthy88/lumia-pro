const CACHE_NAME = 'lumina-studio-v3';
const CACHE_PREFIX = 'lumina-studio-';

// Only precache production assets (not /src/ files)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/models/face_landmarker.task',
  '/luts/bw/kodak_tri-x_400.cube',
  '/luts/bw/ilford_hp_5_plus_400.cube',
  '/luts/kodak_ektachrome_100_vs.cube',
  '/luts/kodak_portra_160_vc.cube',
  '/luts/fuji_superia_200.cube',
  '/luts/polaroid_690.cube'
];

const CACHE_FIRST_PATTERNS = [
  /\.task$/,
  /\.wasm$/,
  /\.cube$/,
  /vendor-.*\.js$/,
  /models\//
];

// Don't cache API responses with auth
const NO_CACHE_PATTERNS = [
  /^https:\/\/generativelanguage\.googleapis\.com/
];

const STALE_WHILE_REVALIDATE_PATTERNS = [
  /\.js$/,
  /\.css$/
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS).catch(e => console.warn('Precache failed:', e)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.filter(n => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME)
          .map(n => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and API calls with auth
  if (event.request.method !== 'GET') return;
  if (NO_CACHE_PATTERNS.some(p => p.test(url.href))) return;
  if (event.request.headers.has('Authorization')) return;
  
  const isCacheFirst = CACHE_FIRST_PATTERNS.some(p => p.test(url.pathname));
  const isStaleWhileRevalidate = STALE_WHILE_REVALIDATE_PATTERNS.some(p => p.test(url.pathname));

  if (isCacheFirst) {
    event.respondWith(
      caches.match(event.request).then(r => r || fetch(event.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }))
    );
  } else if (isStaleWhileRevalidate) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
    );
  } else {
    // Default: Network first with cache fallback
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
