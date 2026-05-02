const CACHE_NAME = 'kinara-cache-v16';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './data.js',
  './logo-main.png',
  './Hero (2).png',
  './hero-mobile.png',
  './bg.png',
  './manifest.json',
  './hyper-realistic-cinematic-169-horizontal-seamless-.mp4',
  './hyper-realistic-cinematic-916-vertical-video-of-a-.mp4'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});
