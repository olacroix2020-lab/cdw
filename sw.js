// Nom du cache et ressources à précharger
const CACHE_NAME = "consistoire-cache-v1";
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
  console.log("🟦 [SW] Installation en cours...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // On ajoute chaque fichier individuellement pour éviter un plantage
        return Promise.all(
          urlsToCache.map(url => 
            cache.add(url).catch(err => console.error("❌ [SW] Erreur cache fichier :", url, err))
          )
        );
      })
      .then(() => console.log("🟩 [SW] Mise en cache initiale"))
  );
  self.skipWaiting();
});

// --- ACTIVATION ---
self.addEventListener("activate", event => {
  console.log("🟨 [SW] Activation");
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key !== CACHE_NAME)
        .map(key => {
          console.log("🗑️ [SW] Suppression ancien cache:", key);
          return caches.delete(key);
        })
    ))
  );
  self.clients.claim();
});

// --- FETCH / RÉPONSE ---
self.addEventListener("fetch", event => {
  // On ignore les requêtes vers d'autres domaines (comme ton iframe distant)
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log("📦 [SW] Cache hit:", event.request.url);
          return response;
        }
        // Sinon, fetch et mettre en cache
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) return networkResponse;
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return networkResponse;
        });
      })
      .catch(err => {
        console.warn("⚠️ [SW] Erreur fetch:", err);
        return new Response("Contenu indisponible hors ligne", {
          status: 503,
          statusText: "Offline"
        });
      })
  );
});
