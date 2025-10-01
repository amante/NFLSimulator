// sw.js — v3.10.5
const CACHE_NAME = 'nflsim-v3.10.5';
const OFFLINE_JSON = '/NFLSimulator/data/schedule_2025.json'; // Adjust base path if serving elsewhere

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll([
        '/', '/NFLSimulator/', '/NFLSimulator/index.html',
        '/NFLSimulator/app.html', '/NFLSimulator/css/styles.css',
        '/NFLSimulator/js/version.js', '/NFLSimulator/js/table.js',
        '/NFLSimulator/js/scheduleLoader.js', OFFLINE_JSON
      ]);
    } catch (e) { /* ignore failures for now */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k === CACHE_NAME) ? null : caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Serve offline json from cache if available
  if (url.pathname.endsWith('/data/schedule_2025.json')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const res = await fetch(event.request);
        if (res && res.ok) {
          cache.put(event.request, res.clone());
        }
        return res;
      } catch {
        // Fallback small empty JSON
        return new Response(JSON.stringify({ year: 2025, games: [] }), {
          headers: { 'Content-Type': 'application/json' }, status: 200
        });
      }
    })());
    return;
  }
  // Generic: network-first then cache
  event.respondWith((async () => {
    try {
      const res = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, res.clone());
      return res;
    } catch {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      return new Response('Offline', { status: 200 });
    }
  })());
});
