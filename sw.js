const V = "v7";
const STATIC = `rs-static-${V}`, TILES = `rs-tiles-${V}`, FONTS = `rs-fonts-${V}`;
const CORE = ["./", "./index.html", "./upgrade.js", "./scrollfx.js", "./manifest.json", "./icon-180.png", "./icon-192.png", "./icon-512.png",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(STATIC).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => ![STATIC, TILES, FONTS].includes(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

const ok = r => r && (r.ok || r.type === "opaque");
async function cacheFirst(req, name, max) {
  const c = await caches.open(name), hit = await c.match(req, { ignoreVary: true });
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (ok(res)) { c.put(req, res.clone()); if (max) c.keys().then(k => k.length > max && c.delete(k[0])); }
    return res;
  } catch (e) { return Response.error(); }
}
async function swr(req, name) {
  const c = await caches.open(name), hit = await c.match(req);
  const net = fetch(req).then(res => { if (ok(res)) c.put(req, res.clone()); return res; }).catch(() => null);
  return hit || (await net) || Response.error();
}
async function netFirst(req) {
  const c = await caches.open(STATIC);
  try {
    const res = await Promise.race([fetch(req), new Promise((_, j) => setTimeout(j, 4000))]);
    if (res.ok) c.put(req, res.clone());
    return res;
  } catch (e) {
    return (await c.match(req, { ignoreSearch: true })) || (await c.match("./index.html")) || Response.error();
  }
}

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.hostname === "tile.openstreetmap.org") return e.respondWith(cacheFirst(r, TILES, 2500));
  if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") return e.respondWith(swr(r, FONTS));
  if (u.hostname === "unpkg.com") return e.respondWith(cacheFirst(r, STATIC));
  if (u.origin !== location.origin) return; // météo / taux / routes : cache géré par l'app
  e.respondWith(netFirst(r));
});
