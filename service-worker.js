const CACHE_NAME = 'autoupcell-cache-v12';
const urlsToCache = [
  '/edc/',
  '/edc/index.html',
  '/edc/style.css',
  '/edc/app.js',
  '/edc/klik.wav',
  '/edc/manifest.json',
  '/edc/edc.html',
  '/edc/main.js',
  '/edc/qrcode.png',
  '/edc/icone-512.png',
  '/edc/icone-192.png'
  
  
  // tambahkan file lain yang perlu di-cache
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
    .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.filter(cn => cn !== CACHE_NAME)
        .map(cn => caches.delete(cn))
      )
    )
  );
});