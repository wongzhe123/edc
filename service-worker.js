const CACHE_NAME = 'autoupcell-cache-v34';
const urlsToCache = [
  '/edc/',
  '/edc/index.html',
  '/edc/style.css',
  '/edc/app.js',
  '/edc/manifest.json',
  '/edc/edc.html',
  '/edc/main.js',
  '/edc/qrcode.png',
  '/edc/images/icone-512.png',
  '/edc/images/icone-192.png'
  // klik.wav sengaja tidak dimasukkan biar instalasi ringan
];

// Install service worker dan cache file penting
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Fetch: ambil dari cache dulu, kalau tidak ada ambil dari network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Activate: hapus cache lama kalau ada versi baru
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
        .filter(cn => cn !== CACHE_NAME)
        .map(cn => caches.delete(cn))
      );
    })
  );
});