const CACHE_NAME = 'get-impro-v28';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/app.js',
  './js/audioEngine.js',
  './js/musicLogic.js',
  './js/fretboard.js',
  './js/piano.js',
  './js/caged.js',
  './assets/icon.svg'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Cacheando archivos estáticos...');
      return cache.addAll(ASSETS);
    })
  );
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
});

// Mensaje para forzar la activación inmediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Estrategia Stale-While-Revalidate (Actualiza en segundo plano)
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Si la petición es válida, actualizamos la caché silenciosamente
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback silencioso en caso de no tener red
      });

      // Retorna la caché inmediatamente si existe, si no, espera a la red
      return cachedResponse || fetchPromise;
    })
  );
});
