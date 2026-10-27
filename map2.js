/* map2.js — refonte complète de la carte : plein écran, GPS + cap, guidage pas à pas, accessibilité */
(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rad = Math.PI / 180, calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hav = (a, b) => { const x = Math.sin((b.lat - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lng - a.lng) * rad / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const bearing = (a, b) => { const dl = (b.lng - a.lng) * rad; return (Math.atan2(Math.sin(dl) * Math.cos(b.lat * rad), Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos(dl)) / rad + 360) % 360; };
const fmtD = m => m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : Math.max(10, Math.round(m / 10) * 10) + ' m';
const fmtT = s => { const m = Math.max(1, Math.round(s / 60)); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : m + ' min'; };
const NAMES = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest'], dirName = a => NAMES[Math.round(a / 45) % 8];
const MOD = { left: 'à gauche', right: 'à droite', 'slight left': 'légèrement à gauche', 'slight right': 'légèrement à droite', 'sharp left': 'franchement à gauche', 'sharp right': 'franchement à droite' };
const instr = s => { const on = s.name ? ` sur ${s.name}` : ''; if (s.type === 'arrive') return 'Vous êtes arrivé'; if (s.mod === 'uturn') return 'Faites demi-tour' + on; if (s.type === 'roundabout' || s.type === 'rotary') return 'Au rond-point, continuez' + on; if (!s.mod || s.mod === 'straight') return 'Continuez tout droit' + on; return `Tournez ${MOD[s.mod] || ''}` + on; };
const day = () => itineraryData.find(d => d.id === mapCurrentDayId) || itineraryData[0];
const target = () => day().steps[mapCurrentStepIdx] || day().steps[0];

/* ---------- état ---------- */
let me = null, heading = null, liveId = null, follow = false, meMk = null, meCi = null, first = false, lastOri = 0, rq = 0;
let route = null, guideL = null, lastFrom = null, lastRouteAt = 0, gTok = 0, lastKey = '', arrivedFor = null, chipsDay = null, ph = null, wl = null;

/* ---------- CSS ---------- */
const st = document.createElement('style');
st.textContent = `[hidden]{display:none!important}
#tab-carte{padding:10px 10px 24px}
#m2{display:flex;flex-direction:column;background:var(--bg-card);border:1px solid var(--border-soft);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-card)}
#m2 .day-selector{padding:8px 8px 6px;background:var(--bg-paper)}
.m2-mapwrap{position:relative;display:flex;flex-direction:column;flex:1 1 auto;min-height:0}
#m2 #voyageMap{height:56vh;min-height:340px;border:0;border-radius:0;flex:1 1 auto}
#m2.full{position:fixed;inset:0;z-index:10050;border-radius:0;border:0;height:100vh;height:100dvh}
#m2.full #voyageMap{height:auto;min-height:0}
#m2.full .m2-sheet{max-height:44vh;overflow:auto}
body.m2-lock{overflow:hidden}
.m2-ctl{position:absolute;right:10px;top:10px;z-index:700;display:flex;flex-direction:column;gap:8px}
.m2-b{width:48px;height:48px;border-radius:14px;border:1.5px solid var(--border-soft);background:#fff;font-size:1.3rem;font-weight:700;color:var(--text-main);box-shadow:0 4px 12px rgba(0,0,0,.22);cursor:pointer;font-family:inherit}
.m2-b.on{background:#1A73E8;color:#fff;border-color:#1A73E8}
.m2-head{position:absolute;left:10px;top:10px;z-index:700;background:rgba(44,34,30,.9);color:#fff;border-radius:99px;padding:7px 13px;font-size:.78rem;font-weight:700}
.m2-sheet{padding:12px 14px 14px;background:var(--bg-card);border-top:1px solid var(--border-soft)}
.m2-row{display:flex;gap:12px;align-items:center}
.m2-arrow{flex:0 0 56px;height:56px;border-radius:50%;background:var(--accent-forest);color:#fff;display:grid;place-items:center}
.m2-arrow svg{width:30px;height:30px;transition:transform .2s linear}
.m2-info{flex:1;min-width:0}
.m2-info h3{font-size:1.02rem;line-height:1.25;margin:4px 0 2px}
#m2Stat{font-size:.86rem;color:var(--text-muted)}#m2Stat b{color:var(--text-main)}
#m2Turn{font-size:.92rem;font-weight:700;color:var(--accent-forest);margin:8px 0 0;min-height:1.2em}
.m2-act{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
#m2 .btn-map-ctrl{min-height:46px;display:flex;align-items:center;justify-content:center;text-decoration:none;text-align:center}
.m2-chips{display:flex;gap:8px;overflow-x:auto;padding:10px 2px 4px;scrollbar-width:none}
.m2-chip{flex:0 0 auto;max-width:170px;min-height:44px;display:flex;gap:6px;align-items:center;border:1.5px solid var(--border-soft);background:var(--bg-paper);border-radius:12px;padding:6px 10px;font-family:inherit;font-size:.76rem;font-weight:700;color:var(--text-main);cursor:pointer;text-align:left}
.m2-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.m2-chip.on{background:var(--accent-terra);border-color:var(--accent-terra);color:#fff}
.m2-next{font-size:.8rem;color:var(--text-muted);margin-top:6px}
.m2-more{margin-top:10px}.m2-more summary{min-height:44px;display:flex;align-items:center;font-weight:700;font-size:.84rem;cursor:pointer}.m2-more button{width:100%;margin-top:8px}
#routeStat{padding:6px 12px;background:#fff;font-size:.74rem;color:var(--text-muted)}
#m2 :focus-visible{outline:3px solid #1A73E8;outline-offset:2px}
.m2-me{position:relative;width:60px;height:60px}
.m2-cone{position:absolute;inset:0;transition:transform .15s linear}
.m2-cone::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(26,115,232,.55),rgba(26,115,232,0) 70%);clip-path:polygon(50% 50%,12% 0,88% 0)}
.m2-dot{position:absolute;left:21px;top:21px;width:18px;height:18px;border-radius:50%;background:#1A73E8;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.m2-me.nohead .m2-cone{display:none}
@media (prefers-reduced-motion:reduce){.m2-arrow svg,.m2-cone{transition:none}}`;
document.head.appendChild(st);

/* ---------- interface ---------- */
$('#tab-carte').innerHTML = `<div id="m2" role="region" aria-label="Carte et navigation">
<div class="day-selector" id="mapDaySelector" role="group" aria-label="Choisir le jour"></div>
<div class="m2-mapwrap"><div id="voyageMap" aria-label="Carte interactive"></div>
<div class="m2-ctl">
<button type="button" class="m2-b" id="m2In" aria-label="Zoom avant">+</button>
<button type="button" class="m2-b" id="m2Out" aria-label="Zoom arrière">−</button>
<button type="button" class="m2-b" id="m2Me" aria-label="Centrer sur ma position">🎯</button>
<button type="button" class="m2-b" id="m2Both" aria-label="Voir ma position et la destination">🏁</button>
<button type="button" class="m2-b" id="m2Fit" aria-label="Voir tout le parcours du jour">🗺️</button>
<button type="button" class="m2-b" id="m2Full" aria-label="Plein écran">⛶</button></div>
<div class="m2-head" id="m2Head" hidden></div></div>
<div class="m2-sheet"><div class="m2-row"><div class="m2-arrow" id="m2Arrow" aria-hidden="true" hidden><svg viewBox="0 0 40 40"><path d="M20 3 33 33 20 26 7 33Z" fill="currentColor"/></svg></div>
<div class="m2-info"><span class="tracker-status-pill" id="trackerBadge"></span><h3 id="trackerCurrentTitle"></h3><div id="m2Stat"></div></div></div>
<p id="m2Turn" aria-live="polite"></p>
<div class="m2-act"><button type="button" class="btn-map-ctrl" onclick="moveCoupleStep(-1)">◀ Précédente</button>
<button type="button" class="btn-map-ctrl primary" onclick="moveCoupleStep(1)">Suivante ▶</button>
<button type="button" class="btn-map-ctrl" id="btnRealGps" onclick="toggleRealGps()" aria-pressed="false">📍 Suivre ma position</button>
<a class="btn-map-ctrl" id="trackerGmapsBtn" target="_blank" rel="noopener" href="#">🧭 Google Maps</a>
<button type="button" class="btn-map-ctrl primary" id="m2Done" style="grid-column:1/-1" hidden>✓ Étape faite, passer à la suivante</button></div>
<div class="m2-chips" id="m2Chips" role="group" aria-label="Étapes du jour"></div>
<p id="trackerCurrentDesc" class="step-desc" style="margin:8px 0 0"></p><div id="trackerNextInfo" class="m2-next"></div>
<details class="m2-more"><summary>Plus d'options</summary>
<button type="button" class="btn-map-ctrl" id="btnAutoPlay" onclick="toggleAutoPlay()">▶ Animer le parcours</button>
<button type="button" class="btn-map-ctrl" id="btnOffline" onclick="saveMapOffline()">📥 Sauver la carte du jour hors-ligne</button></details></div></div>`;

/* ---------- carte ---------- */
const meIcon = L.divIcon({ className: '', html: '<div class="m2-me nohead"><div class="m2-cone"></div><div class="m2-dot"></div></div>', iconSize: [60, 60], iconAnchor: [30, 30] });
window.initOrUpdateMap = () => {
  if (!mapInstance) {
    mapInstance = L.map('voyageMap', { zoomControl: false, minZoom: 4, maxZoom: 20, zoomSnap: .5, zoomDelta: 1, wheelPxPerZoomLevel: 70, bounceAtZoomLimits: false, inertia: !calm, zoomAnimation: !calm, fadeAnimation: !calm, markerZoomAnimation: !calm }).setView([56.9489, 24.1064], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20, maxNativeZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(mapInstance);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(mapInstance);
    mapInstance.on('dragstart', () => { follow = false; ui(); });
  }
  setTimeout(() => { mapInstance.invalidateSize(); drawDayOnMap(); }, 120);
};

/* ---------- plein écran (le bouton retour du téléphone le ferme aussi) ---------- */
function setFull(on) {
  const el = $('#m2'); if (!el || on === !!ph) return;
  if (on) { ph = document.createElement('div'); ph.style.height = el.offsetHeight + 'px'; el.replaceWith(ph); document.body.appendChild(el); el.classList.add('full'); document.body.classList.add('m2-lock'); history.pushState({ m2: 1 }, ''); }
  else { el.classList.remove('full'); ph.replaceWith(el); ph = null; document.body.classList.remove('m2-lock'); }
  ui(); setTimeout(() => mapInstance && mapInstance.invalidateSize(), 60); $('#m2Full').focus({ preventScroll: true });
}
const exitFull = () => { if (history.state && history.state.m2) history.back(); else setFull(false); };
addEventListener('popstate', () => { if (ph) setFull(false); });
addEventListener('keydown', e => { if (e.key === 'Escape' && ph) exitFull(); });

/* ---------- boussole ---------- */
const onOri = e => {
  let h = null; if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading; else if (e.absolute && e.alpha != null) h = (360 - e.alpha) % 360;
  if (h == null) return; lastOri = Date.now();
  heading = heading == null ? h : (heading + ((h - heading + 540) % 360 - 180) * .25 + 360) % 360; schedule();
};
async function askCompass() {
  try { if (typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) { if (await DeviceOrientationEvent.requestPermission() !== 'granted') return; } } catch (e) {}
  addEventListener('deviceorientationabsolute', onOri, true); addEventListener('deviceorientation', onOri, true);
}
const schedule = () => { if (!rq) rq = requestAnimationFrame(() => { rq = 0; paintHeading(); }); };
function paintHeading() {
  const el = meMk && meMk.getElement(), hd = $('#m2Head');
  if (el) { const m = $('.m2-me', el); m.classList.toggle('nohead', heading == null); $('.m2-cone', el).style.transform = `rotate(${heading || 0}deg)`; }
  hd.hidden = !(me && heading != null); if (!hd.hidden) hd.textContent = `🧭 Vous regardez vers : ${dirName(heading)}`;
  if (me) paintArrow();
}
function paintArrow() {
  const t = target(), brg = bearing(me, t), a = $('#m2Arrow'); a.hidden = false;
  $('svg', a).style.transform = `rotate(${heading == null ? brg : (brg - heading + 360) % 360}deg)`;
  let txt; if (heading == null) txt = `Cap ${dirName(brg)} (${Math.round(brg)}°)`; else { const df = (brg - heading + 540) % 360 - 180, ab = Math.abs(df); txt = ab < 20 ? 'Tout droit' : ab < 70 ? `Légèrement à ${df > 0 ? 'droite' : 'gauche'}` : ab < 120 ? `À ${df > 0 ? 'droite' : 'gauche'}` : 'Demi-tour'; }
  $('#m2Stat').innerHTML = `<b>${txt}</b> · ${statText(t)}`;
}
const statText = t => { const d = hav(me, t) * 1000; if (d < 30) return '✅ Vous y êtes !'; return route && route.to === t.id ? `🚶 ${fmtD(route.d)} · ≈ ${fmtT(route.d / 1.33)} à pied` : `à vol d'oiseau : ${fmtD(d)}`; };

/* ---------- GPS ---------- */
const wakeOn = async () => { try { wl = await navigator.wakeLock.request('screen'); } catch (e) {} };
const wakeOff = () => { try { wl && wl.release(); } catch (e) {} wl = null; };
document.addEventListener('visibilitychange', () => { if (!document.hidden && liveId !== null) wakeOn(); });
function say(m) { $('#m2Turn').textContent = m; }
function startLive() {
  if (!navigator.geolocation) return say('Géolocalisation indisponible sur cet appareil.');
  if (liveId !== null) return;
  askCompass(); wakeOn(); follow = true; first = true;
  liveId = navigator.geolocation.watchPosition(onPos, er => { stopLive(); say(er.code === 1 ? 'Localisation refusée : autorisez-la dans les réglages du navigateur.' : 'Position introuvable pour le moment, réessayez dehors.'); }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
  gpsWatchId = liveId; say('Recherche de votre position…'); ui();
}
function stopLive() {
  if (liveId !== null) navigator.geolocation.clearWatch(liveId); liveId = null; gpsWatchId = null;
  removeEventListener('deviceorientationabsolute', onOri, true); removeEventListener('deviceorientation', onOri, true); wakeOff();
  if (meMk) { mapInstance.removeLayer(meMk); mapInstance.removeLayer(meCi); } meMk = meCi = null; me = null; heading = null;
  clearGuide(); $('#m2Arrow').hidden = true; $('#m2Head').hidden = true; ui(); sheet();
}
function onPos(p) {
  const c = p.coords; me = { lat: c.latitude, lng: c.longitude, acc: c.accuracy }; const ll = [me.lat, me.lng];
  if (Date.now() - lastOri > 3000 && c.heading != null && !isNaN(c.heading) && c.speed > 1) heading = c.heading;
  if (!meMk) { meMk = L.marker(ll, { icon: meIcon, interactive: false, keyboard: false, zIndexOffset: 2000 }).addTo(mapInstance); meCi = L.circle(ll, { radius: me.acc, color: '#1A73E8', weight: 1, fillOpacity: .1, interactive: false }).addTo(mapInstance); }
  else { meMk.setLatLng(ll); meCi.setLatLng(ll).setRadius(me.acc); }
  if (first) { first = false; say(''); if (hav(me, target()) > 25) mapInstance.setView(ll, 16); else fitMeTarget(); } else if (follow) mapInstance.panTo(ll, { animate: false });
  paintHeading(); sheet(); guide(false);
}
function fitMeTarget() { const t = target(); if (!me || !t || !mapInstance) return; mapInstance.stop(); mapInstance.fitBounds(L.latLngBounds([[me.lat, me.lng], [t.lat, t.lng]]), { padding: [70, 70], maxZoom: 17, animate: !calm }); }

/* ---------- guidage pas à pas depuis ma position (itinéraire piéton OSM) ---------- */
function clearGuide() { if (guideL && mapInstance) mapInstance.removeLayer(guideL); guideL = null; route = null; }
function drawGuide(pts, thin) {
  if (guideL) mapInstance.removeLayer(guideL);
  guideL = L.featureGroup([L.polyline(pts, { color: '#fff', weight: 10, opacity: .85, interactive: false }), L.polyline(pts, { color: '#1A73E8', weight: thin ? 4 : 6, opacity: thin ? .6 : .95, interactive: false })]).addTo(mapInstance);
}
async function guide(force) {
  const t = target(); if (!me || !t) return;
  if (!force && (Date.now() - lastRouteAt < 10000 || (route && route.to === t.id && lastFrom && hav(lastFrom, me) * 1000 < 40))) return;
  if (hav(me, t) > 25) { clearGuide(); say('Trop loin pour y aller à pied : utilisez le bouton Google Maps (transports).'); return; }
  lastRouteAt = Date.now(); lastFrom = { lat: me.lat, lng: me.lng }; const tok = ++gTok;
  try {
    const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 9000);
    const j = await (await fetch(`https://routing.openstreetmap.de/routed-foot/route/v1/foot/${me.lng},${me.lat};${t.lng},${t.lat}?overview=full&geometries=geojson&steps=true`, { signal: ctl.signal })).json(); clearTimeout(to);
    const R = j.routes && j.routes[0]; if (j.code !== 'Ok' || !R || tok !== gTok) throw 0;
    route = { to: t.id, d: R.distance, i: 1, steps: R.legs[0].steps.map(s => ({ type: s.maneuver.type, mod: s.maneuver.modifier, name: s.name, loc: s.maneuver.location })) };
    drawGuide(R.geometry.coordinates.map(c => [c[1], c[0]]));
  } catch (e) { if (tok !== gTok) return; route = null; drawGuide([[me.lat, me.lng], [t.lat, t.lng]], true); say('Itinéraire précis indisponible (hors-ligne ?) : suivez la flèche.'); }
  sheet(); turn();
}
function turn() {
  const t = target(); if (!me || !route || route.to !== t.id) return;
  const r = route; while (r.i < r.steps.length - 1 && hav(me, { lat: r.steps[r.i].loc[1], lng: r.steps[r.i].loc[0] }) < .02) r.i++;
  const s = r.steps[r.i], d = hav(me, { lat: s.loc[1], lng: s.loc[0] }) * 1000, key = instr(s) + '|' + Math.round(d / 50);
  if (key !== lastKey) { lastKey = key; say(s.type === 'arrive' ? 'Vous arrivez à destination' : `Dans ${fmtD(d)} : ${instr(s)}`); }
}

/* ---------- panneau d'info ---------- */
function renderChips() {
  const d = day(); chipsDay = d.id;
  $('#m2Chips').innerHTML = d.steps.map((s, i) => `<button type="button" class="m2-chip" data-i="${i}" aria-label="Étape ${i + 1} : ${s.title.replace(/"/g, '')}"><b>${i + 1}</b><span>${s.title.replace(/</g, '&lt;')}</span></button>`).join('');
}
function sheet() {
  const t = target(); if (!t) return;
  $$('#m2Chips .m2-chip').forEach((b, i) => { const a = i === mapCurrentStepIdx; b.classList.toggle('on', a); a ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current'); });
  const g = $('#trackerGmapsBtn'), far = me && hav(me, t) > 3;
  g.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(t.q || t.lat + ',' + t.lng)}&travelmode=${far ? 'transit' : 'walking'}`;
  g.textContent = far ? '🚌 Itinéraire transports' : '🧭 Google Maps à pied';
  if (!me) { $('#m2Stat').textContent = 'Activez « Suivre ma position » pour voir la distance et le sens à prendre.'; return; }
  paintArrow();
  const near = hav(me, t) * 1000 < 30; $('#m2Done').hidden = !near;
  if (near && arrivedFor !== t.id) { arrivedFor = t.id; say('Vous êtes arrivé à ' + t.title); }
}
function ui() {
  const live = liveId !== null, b = $('#btnRealGps');
  b.textContent = live ? '📡 Suivi actif (arrêter)' : '📍 Suivre ma position'; b.setAttribute('aria-pressed', live); b.classList.toggle('gps-active', live);
  $('#m2Me').classList.toggle('on', live && follow); const f = $('#m2Full'); f.textContent = ph ? '✕' : '⛶'; f.setAttribute('aria-label', ph ? 'Quitter le plein écran' : 'Plein écran');
}

/* ---------- branchements ---------- */
window.toggleRealGps = () => liveId !== null ? stopLive() : startLive();
window.stopRealGps = () => {};                       // l'ancien code l'appelait à chaque changement d'étape : le suivi reste maintenant actif
const _u = window.updateCouplePositionOnProgram;
window.updateCouplePositionOnProgram = function (f) {
  _u.apply(this, arguments); if (chipsDay !== mapCurrentDayId) renderChips();
  clearGuide(); lastKey = ''; arrivedFor = null; if (!me) say('');
  if (me) { if (!f) fitMeTarget(); guide(true); } sheet();
};
const _fd = window.fitDayOnMap; window.fitDayOnMap = () => { follow = false; ui(); if (_fd) _fd(); };
$('#m2In').onclick = () => mapInstance && mapInstance.zoomIn(1);
$('#m2Out').onclick = () => mapInstance && mapInstance.zoomOut(1);
$('#m2Me').onclick = () => { if (liveId === null) return startLive(); follow = true; if (me) mapInstance.setView([me.lat, me.lng], Math.max(mapInstance.getZoom(), 17), { animate: !calm }); ui(); };
$('#m2Both').onclick = () => { if (!me) { startLive(); return; } follow = false; ui(); fitMeTarget(); };
$('#m2Fit').onclick = () => fitDayOnMap();
$('#m2Full').onclick = () => ph ? exitFull() : setFull(true);
$('#m2Done').onclick = () => { const t = target(); if (!checkedSteps[t.id]) toggleStep(t.id); moveCoupleStep(1); };
$('#m2Chips').onclick = e => { const b = e.target.closest('.m2-chip'); if (!b) return; stopAutoPlay(); mapCurrentStepIdx = +b.dataset.i; updateCouplePositionOnProgram(false); b.scrollIntoView({ inline: 'center', block: 'nearest' }); };
renderMapDaySelector(); renderChips(); sheet(); ui();
})();
