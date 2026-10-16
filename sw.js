const CACHE_STATIC = "riga-stockholm-static-v3";
const CACHE_TILES = "riga-stockholm-tiles-v3";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js",
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,700;1,9..144,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(k => {
          if (k !== CACHE_STATIC && k !== CACHE_TILES) return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Mise en cache automatique des tuiles OpenStreetMap pour usage hors-ligne
  if (url.hostname.includes("tile.openstreetmap.org")) {
    event.respondWith(
      caches.open(CACHE_TILES).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request)
            .then(res => {
              if (res && res.status === 200) cache.put(event.request, res.clone());
              return res;
            })
            .catch(() => cached);
        })
      )
    );
    return;
  }

  // Stratégie Network-First avec repli hors-ligne immédiat
  event.respondWith(
    fetch(event.request)
      .then(res => {
        if (res && res.status === 200 && event.request.method === "GET") {
          const copy = res.clone();
          caches.open(CACHE_STATIC).then(c => c.put(event.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then(r => r || caches.match("./index.html")))
  );
});
