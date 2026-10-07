const CACHE_NAME = "consistoire-cache-v2";

const urlsToCache = [
  "/",
  "/index.html",
  "/site.webmanifest",
  "/favicon-96x96.png",
  "/favicon.svg",
  "/apple-touch-icon.png",
  "/favicon.ico",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/coucher.jpg"
];


// --- INSTALLATION ---
self.addEventListener("install", event => {
  console.log("[SW] Installation :", CACHE_NAME);

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(url =>
          cache.add(url).catch(err => {
            console.warn("[SW] Impossible de mettre en cache :", url, err);
          })
        )
      );
    })
  );

  // Active immédiatement la nouvelle version
  self.skipWaiting();
});


// --- ACTIVATION ---
self.addEventListener("activate", event => {
  console.log("[SW] Activation :", CACHE_NAME);

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log("[SW] Suppression ancien cache :", key);
            return caches.delete(key);
          })
      );
    })
  );

  // Prend immédiatement le contrôle des pages ouvertes
  self.clients.claim();
});


// --- FETCH ---
self.addEventListener("fetch", event => {

  // On ignore les requêtes vers d'autres domaines
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Pour les navigations HTML :
  // TOUJOURS essayer le réseau en premier.
  if (event.request.mode === "navigate") {

    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {

          // Met à jour le cache avec la nouvelle page
          if (networkResponse.ok) {
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch(() => {

          // Si Internet est indisponible,
          // utiliser l'ancienne page en secours.
          return caches.match(event.request)
            .then(cachedResponse => {
              return cachedResponse || new Response(
                "Contenu indisponible hors ligne",
                {
                  status: 503,
                  statusText: "Offline"
                }
              );
            });

        })
    );

    return;
  }


  // Pour les autres ressources :
  // cache d'abord, réseau ensuite.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then(networkResponse => {

          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        });

      })
  );

});
