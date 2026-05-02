const CACHE_NAME = 'kinara-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './logo-main.png',
  './Hero (2).png',
  './Hero-Mob.png',
  './bg.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
