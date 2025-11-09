// بسيط: تخزين أساسي للأصول لتحسين الأداء والعمل الجزئي دون اتصال
const CACHE_NAME = 'learn-grandpa-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/partials/intro.html',
  '/partials/act1.html',
  '/partials/act2.html',
  '/partials/act3.html',
  '/partials/act4.html',
  '/partials/act5.html',
  '/partials/result.html',
  '/assets/sounds/correct.mp3',
  '/assets/sounds/wrong.mp3',
  '/assets/sounds/cheer.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // استراتيجية: Cache, falling back to network؛ للأصوات نُفضّل الشبكة أولًا
  if (request.destination === 'audio') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});