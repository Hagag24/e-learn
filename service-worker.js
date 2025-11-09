// بسيط: تخزين أساسي للأصول لتحسين الأداء والعمل الجزئي دون اتصال
// تم تحديث اسم الكاش لضمان جلب النسخ الجديدة من الملفات بعد تغييرات التطوير
const CACHE_NAME = 'learn-grandpa-v3';
// أصول حرجة فقط لتسريع التحميل الأول دون جلب ملفات ثقيلة مسبقًا
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/partials-bundle.js'
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
  const dest = request.destination;
  // للأصوات: شبكة أولًا مع فولبك للكاش
  if (dest === 'audio') {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }
  // للوثائق والسكريبتات: شبكة أولًا لتجنب الشيفرة القديمة من الكاش أثناء التطوير
  if (dest === 'document' || dest === 'script') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  // لباقي الأصول (صور، ستايلات): كاش أولًا مع فولبك للشبكة
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});