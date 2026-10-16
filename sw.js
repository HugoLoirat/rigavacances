const CACHE_STATIC = "riga-stockholm-static-v4";
const CACHE_TILES = "riga-stockholm-tiles-v4";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC).then(cache => cache.addAll(CORE_ASSETS))
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
