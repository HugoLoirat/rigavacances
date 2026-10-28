/* map2.js — carte : plein écran immersif façon appli Maps
   - carte edge-to-edge, barre flottante, panneau glissant à 3 crans (aperçu / moitié / complet)
   - GPS + boussole, guidage pas à pas, caméra qui tient compte du panneau
   - bouton retour du téléphone, Échap, clavier et lecteurs d'écran gérés */
(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const rad = Math.PI / 180, clamp = (v, a, b) => Math.min(b, Math.max(a, v));
let calm = matchMedia('(prefers-reduced-motion: reduce)').matches; try { if (localStorage.getItem('rs_calm') === '1') calm = true; } catch (e) {}
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hav = (a, b) => { const x = Math.sin((b.lat - a.lat) * rad / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lng - a.lng) * rad / 2) ** 2; return 12742 * Math.asin(Math.sqrt(x)); };
const bearing = (a, b) => { const dl = (b.lng - a.lng) * rad; return (Math.atan2(Math.sin(dl) * Math.cos(b.lat * rad), Math.cos(a.lat * rad) * Math.sin(b.lat * rad) - Math.sin(a.lat * rad) * Math.cos(b.lat * rad) * Math.cos(dl)) / rad + 360) % 360; };
const fmtD = m => m >= 1000 ? (m / 1000).toFixed(1).replace('.', ',') + ' km' : Math.max(10, Math.round(m / 10) * 10) + ' m';
const fmtT = s => { const m = Math.max(1, Math.round(s / 60)); return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : m + ' min'; };
const NAMES = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ouest', 'Ouest', 'Nord-Ouest'], dirName = a => NAMES[Math.round(a / 45) % 8];
const MOD = { left: 'à gauche', right: 'à droite', 'slight left': 'légèrement à gauche', 'slight right': 'légèrement à droite', 'sharp left': 'franchement à gauche', 'sharp right': 'franchement à droite' };
const instr = s => { const on = s.name ? ` sur ${s.name}` : ''; if (s.type === 'arrive') return 'Vous êtes arrivé'; if (s.mod === 'uturn') return 'Faites demi-tour' + on; if (s.type === 'roundabout' || s.type === 'rotary') return 'Au rond-point, continuez' + on; if (!s.mod || s.mod === 'straight') return 'Continuez tout droit' + on; return `Tournez ${MOD[s.mod] || ''}` + on; };
const day = () => itineraryData.find(d => d.id === mapCurrentDayId) || itineraryData[0];
const target = () => day().steps[mapCurrentStepIdx] || day().steps[0];
const buzz = n => { try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} };

/* ---------- état ---------- */
let me = null, heading = null, liveId = null, follow = false, meMk = null, meCi = null, first = false, lastOri = 0, rq = 0;
let route = null, guideL = null, lastFrom = null, lastRouteAt = 0, gTok = 0, lastKey = '', arrivedFor = null, chipsDay = null, ph = null, wl = null;
let cam = 'step';            // ce que la caméra suit : step | me | both | day | free
let st = 'peek';             // cran du panneau : peek | half | full
let snaps = null, curVis = 0, lastIdx = null, lastDay = null, themeOld = null, listKey = '', lt = 0, dg = null;

/* ---------- icônes ---------- */
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" ${extra}>${d}</svg>`;
const sk = 'fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';
const IC = {
  locate: svg('<circle cx="12" cy="12" r="3.2" fill="currentColor"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 1.8v3.6M12 18.6v3.6M1.8 12h3.6M18.6 12h3.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  both: svg('<path d="M6.5 21V3.5" ' + sk + '/><path d="M6.5 4.5h11.5l-2.6 4.2 2.6 4.2H6.5Z" fill="currentColor" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>'),
  fit: svg('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" ' + sk + '/>'),
  full: svg('<path d="M14 4h6v6M10 20H4v-6M20 4l-7.2 7.2M4 20l7.2-7.2" ' + sk + '/>'),
  close: svg('<path d="M6 6l12 12M18 6L6 18" ' + sk + '/>'),
  chev: `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path d="M6 9l6 6 6-6" ${sk}/></svg>`
};

/* ---------- CSS ---------- */
const css = document.createElement('style');
css.textContent = `[hidden]{display:none!important}
#tab-carte{padding:10px 10px 24px}
#m2{--sat:env(safe-area-inset-top,0px);--sab:env(safe-area-inset-bottom,0px);display:flex;flex-direction:column;background:var(--bg-card);border:1px solid var(--border-soft);border-radius:var(--radius-lg);overflow:hidden;box-shadow:var(--shadow-card)}
#m2 .day-selector{padding:8px 8px 6px;background:var(--bg-paper)}
.m2-mapwrap{position:relative;display:flex;flex-direction:column;flex:1 1 auto;min-height:0}
#m2 #voyageMap{height:56vh;min-height:340px;border:0;border-radius:0;flex:1 1 auto}
html.m2-lock,body.m2-lock{overflow:hidden;overscroll-behavior:none}

/* éléments communs */
.m2-b{display:grid;place-items:center;padding:0;width:48px;height:48px;border-radius:14px;border:1.5px solid var(--border-soft);background:#fff;font-size:1.5rem;font-weight:700;line-height:1;color:var(--text-main);box-shadow:0 4px 12px rgba(0,0,0,.22);cursor:pointer;font-family:inherit}
.m2-b svg{width:24px;height:24px;display:block}
.m2-b:active{transform:scale(.94)}
.m2-b.on{background:#1A73E8;color:#fff;border-color:#1A73E8}
.m2-b.live{color:#1A73E8;border-color:#1A73E8}
.m2-glass{background:rgba(255,255,255,.92);-webkit-backdrop-filter:blur(14px) saturate(160%);backdrop-filter:blur(14px) saturate(160%);border:1px solid rgba(230,219,208,.95);box-shadow:0 6px 18px rgba(44,34,30,.22)}
.m2-top{position:absolute;left:10px;right:68px;top:10px;z-index:710;display:flex;flex-direction:column;gap:8px;pointer-events:none}
.m2-top>*{pointer-events:auto}
.m2-bar{display:none}
.m2-zoom{display:flex;flex-direction:column;gap:8px}
.m2-ctl{position:absolute;right:10px;top:10px;z-index:700;display:flex;flex-direction:column;gap:8px}
#m2Turn{margin:0;background:#1F3D33;color:#fff;border-radius:16px;padding:11px 14px;font-size:.95rem;font-weight:700;line-height:1.3;box-shadow:0 6px 18px rgba(0,0,0,.3)}
#m2Turn:empty{display:none}
.m2-head{align-self:flex-start;background:rgba(44,34,30,.9);color:#fff;border-radius:99px;padding:7px 13px;font-size:.78rem;font-weight:700}
.m2-grab,.m2-pn{display:none}
.m2-sheet{background:var(--bg-card);border-top:1px solid var(--border-soft)}
.m2-peek{padding:12px 14px 0}
.m2-row{display:flex;gap:12px;align-items:center}
.m2-body{padding:0 14px 14px}
.m2-arrow{flex:0 0 56px;height:56px;border-radius:50%;background:var(--accent-forest);color:#fff;display:grid;place-items:center}
.m2-arrow svg{width:30px;height:30px;transition:transform .2s linear}
.m2-info{flex:1;min-width:0}
.m2-info h3{font-size:1.02rem;line-height:1.25;margin:4px 0 2px}
#m2Stat{font-size:.86rem;color:var(--text-muted)}#m2Stat b{color:var(--text-main)}#m2Stat:empty{display:none}
.m2-act{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}
#m2Done{width:100%;margin-top:10px}
#m2 .btn-map-ctrl{min-height:46px;display:flex;align-items:center;justify-content:center;text-decoration:none;text-align:center}
.m2-chips{display:flex;gap:8px;overflow-x:auto;padding:10px 2px 4px;scrollbar-width:none;touch-action:pan-x}
.m2-chips::-webkit-scrollbar{display:none}
.m2-chip{flex:0 0 auto;max-width:170px;min-height:44px;display:flex;gap:6px;align-items:center;border:1.5px solid var(--border-soft);background:var(--bg-paper);border-radius:12px;padding:6px 10px;font-family:inherit;font-size:.76rem;font-weight:700;color:var(--text-main);cursor:pointer;text-align:left}
.m2-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.m2-chip.on{background:var(--accent-terra);border-color:var(--accent-terra);color:#fff}
.m2-next{font-size:.8rem;color:var(--text-muted);margin-top:6px}.m2-next a{color:var(--accent-terra-dark);font-weight:700}
.m2-list{display:none;list-style:none;margin:12px 0 0;padding:0}
.m2-li{width:100%;min-height:48px;display:flex;align-items:center;gap:10px;padding:8px 6px;border:0;border-top:1px solid var(--border-soft);background:none;font-family:inherit;text-align:left;color:var(--text-main);cursor:pointer}
.m2-li b{flex:0 0 28px;height:28px;border-radius:50%;background:var(--accent-forest);color:#fff;display:grid;place-items:center;font-size:.76rem}
.m2-li.on b{background:var(--accent-gold);color:#2C221E}
.m2-li .t{flex:0 0 5.4em;font-size:.72rem;font-weight:700;color:var(--text-muted);line-height:1.2}
.m2-li .n{flex:1;min-width:0;font-size:.86rem;font-weight:600;line-height:1.25}
.m2-li.on .n{font-weight:800}
.m2-li.done .n{text-decoration:line-through;color:var(--text-muted)}
.m2-li i{font-style:normal;color:var(--accent-forest);font-weight:800}
.m2-more{margin-top:10px}.m2-more summary{min-height:44px;display:flex;align-items:center;font-weight:700;font-size:.84rem;cursor:pointer}.m2-more button{width:100%;margin-top:8px}
#routeStat{padding:6px 12px;background:#fff;font-size:.74rem;color:var(--text-muted)}
#m2 :focus-visible{outline:3px solid #1A73E8;outline-offset:2px}
.m2-me{position:relative;width:60px;height:60px}
.m2-cone{position:absolute;inset:0;transition:transform .15s linear}
.m2-cone::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 50% 50%,rgba(26,115,232,.55),rgba(26,115,232,0) 70%);clip-path:polygon(50% 50%,12% 0,88% 0)}
.m2-dot{position:absolute;left:21px;top:21px;width:18px;height:18px;border-radius:50%;background:#1A73E8;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.m2-me.nohead .m2-cone{display:none}

/* ===== PLEIN ÉCRAN IMMERSIF ===== */
#m2.full{position:fixed;inset:0;z-index:10050;border:0;border-radius:0;box-shadow:none;background:#E9E2D6;height:100vh;height:100dvh;display:block;touch-action:none}
#m2.full .m2-mapwrap{position:absolute;inset:0}
#m2.full #voyageMap{height:auto;min-height:0;flex:1 1 auto}
#m2.full .m2-top{top:calc(var(--sat) + 10px);right:10px}
#m2.full .m2-bar{display:flex;gap:8px;align-items:center}
#m2.full .m2-bar .m2-b{flex:0 0 48px;border-radius:50%}
.m2-daybtn{flex:1;min-width:0;min-height:48px;border-radius:24px;padding:4px 16px;display:flex;align-items:center;justify-content:space-between;gap:8px;font-family:inherit;color:var(--text-main);cursor:pointer;text-align:left}
.m2-daybtn span{min-width:0}
.m2-daybtn b{display:block;font-size:.95rem;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m2-daybtn small{display:block;font-size:.72rem;font-weight:600;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.m2-daybtn svg{flex:0 0 16px;transition:transform .25s}
.m2-daybtn[aria-expanded=true] svg{transform:rotate(180deg)}
#m2.full .day-selector{display:none;position:absolute;left:0;right:0;top:calc(var(--sat) + 68px);z-index:730;background:transparent;padding:2px 10px 10px;touch-action:pan-x;overscroll-behavior-x:contain}
#m2.full.days-open .day-selector{display:flex}
#m2.full.days-open #m2Turn{margin-top:64px}
#m2.full .day-pill{box-shadow:0 4px 12px rgba(44,34,30,.22);min-height:44px}
#m2.full .m2-ctl{top:auto;bottom:30px;right:10px;z-index:705;align-items:flex-end;transition:transform .34s var(--smooth),opacity .2s}
#m2.full .m2-zoom{gap:0;border-radius:24px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,.22)}
#m2.full .m2-zoom .m2-b{border-radius:0;box-shadow:none;border:0}
#m2.full .m2-zoom .m2-b+.m2-b{border-top:1px solid var(--border-soft)}
#m2.full .m2-b{border-radius:50%}
#m2.full #m2Me{width:56px;height:56px}
#m2.full #m2Full{display:none}
#m2.full.st-half .m2-zoom,#m2.full.st-half #m2Fit{display:none}
#m2.full.st-full .m2-ctl,#m2.full.st-full #routeStat{opacity:0;pointer-events:none}
#m2.full .leaflet-bottom{transition:transform .34s var(--smooth)}
#m2.full #routeStat{position:absolute;left:10px;bottom:34px;max-width:calc(100% - 86px);z-index:705;background:rgba(255,255,255,.94);border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,.18);transition:transform .34s var(--smooth),opacity .2s}
#m2.full #routeStat:empty{display:none}
#m2.full .m2-sheet{position:absolute;left:0;right:0;bottom:0;z-index:760;margin:0 auto;max-width:640px;display:flex;flex-direction:column;overflow:hidden;touch-action:none;border:0;border-radius:24px 24px 0 0;box-shadow:0 -8px 30px rgba(44,34,30,.3);padding-bottom:var(--sab);transform:translate3d(0,100%,0);transition:transform .34s var(--smooth);will-change:transform}
#m2.drag .m2-sheet,#m2.drag .m2-ctl,#m2.drag .leaflet-bottom,#m2.drag #routeStat{transition:none!important}
#m2.full .m2-grab{display:block;position:relative;flex:0 0 28px;width:100%;height:28px;padding:0;border:0;background:none;cursor:grab;touch-action:none}
#m2.full .m2-grab i{position:absolute;left:50%;top:10px;width:42px;height:5px;margin-left:-21px;border-radius:3px;background:#CDBFB2}
#m2.full .m2-peek{flex:0 0 auto;padding:0 16px 8px}
#m2.full .m2-info h3{font-size:1.05rem;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
#m2.full .m2-pn{display:flex;gap:8px;flex:0 0 auto}
.m2-pn button{width:46px;height:46px;border-radius:50%;border:1.5px solid var(--border-soft);background:var(--bg-paper);font-size:1.6rem;line-height:1;font-weight:700;color:var(--text-main);cursor:pointer;font-family:inherit;padding:0}
#m2.full .m2-body{flex:1 1 auto;min-height:0;overflow:hidden;padding:0 16px 10px;touch-action:none}
#m2.full.st-full .m2-body{overflow-y:auto;touch-action:pan-y;overscroll-behavior:contain;-webkit-overflow-scrolling:touch}
#m2.full .m2-bodyin{position:relative}
#m2.full .m2-pv,#m2.full .m2-nx{display:none}
#m2.full .m2-list{display:block}
@media (min-width:700px){#m2.full .m2-top{max-width:560px}}
@media (prefers-reduced-motion:reduce){.m2-arrow svg,.m2-cone,#m2 .m2-sheet,#m2 .m2-ctl,#m2 .leaflet-bottom,#m2 #routeStat,.m2-daybtn svg{transition:none!important}}
${calm ? '#m2 .m2-sheet,#m2 .m2-ctl,#m2 .leaflet-bottom,#m2 #routeStat,.m2-arrow svg,.m2-cone{transition:none!important}' : ''}`;
document.head.appendChild(css);

/* ---------- interface ---------- */
$('#tab-carte').innerHTML = `<div id="m2" role="region" aria-label="Carte et navigation">
<div class="day-selector" id="mapDaySelector" role="group" aria-label="Choisir le jour"></div>
<div class="m2-mapwrap"><div id="voyageMap" aria-label="Carte interactive"></div>
<div class="m2-top" id="m2Top">
<div class="m2-bar"><button type="button" class="m2-b m2-glass" id="m2Close" aria-label="Quitter le plein écran">${IC.close}</button>
<button type="button" class="m2-daybtn m2-glass" id="m2DayBtn" aria-expanded="false" aria-controls="mapDaySelector"><span><b id="m2DayTxt"></b><small id="m2StepTxt"></small></span>${IC.chev}</button></div>
<p id="m2Turn" aria-live="polite"></p>
<div class="m2-head" id="m2Head" hidden></div></div>
<div class="m2-ctl" id="m2Ctl">
<div class="m2-zoom"><button type="button" class="m2-b" id="m2In" aria-label="Zoom avant">+</button><button type="button" class="m2-b" id="m2Out" aria-label="Zoom arrière">−</button></div>
<button type="button" class="m2-b" id="m2Fit" aria-label="Voir tout le parcours du jour">${IC.fit}</button>
<button type="button" class="m2-b" id="m2Both" aria-label="Voir ma position et la destination">${IC.both}</button>
<button type="button" class="m2-b" id="m2Me" aria-label="Me localiser et suivre ma position" aria-pressed="false">${IC.locate}</button>
<button type="button" class="m2-b" id="m2Full" aria-label="Plein écran">${IC.full}</button></div></div>
<div class="m2-sheet" id="m2Sheet"><button type="button" class="m2-grab" id="m2Grab" aria-label="Agrandir ou réduire le panneau" aria-expanded="false"><i></i></button>
<div class="m2-peek" id="m2Peek"><div class="m2-row"><div class="m2-arrow" id="m2Arrow" aria-hidden="true" hidden><svg viewBox="0 0 40 40"><path d="M20 3 33 33 20 26 7 33Z" fill="currentColor"/></svg></div>
<div class="m2-info"><span class="tracker-status-pill" id="trackerBadge"></span><h3 id="trackerCurrentTitle"></h3><div id="m2Stat"></div></div>
<div class="m2-pn"><button type="button" id="m2Prev" aria-label="Étape précédente">‹</button><button type="button" id="m2Next" aria-label="Étape suivante">›</button></div></div>
<button type="button" class="btn-map-ctrl primary" id="m2Done" hidden>✓ Étape faite, passer à la suivante</button></div>
<div class="m2-body" id="m2Body"><div class="m2-bodyin" id="m2BodyIn">
<div class="m2-act"><button type="button" class="btn-map-ctrl m2-pv" onclick="moveCoupleStep(-1)">◀ Précédente</button>
<button type="button" class="btn-map-ctrl primary m2-nx" onclick="moveCoupleStep(1)">Suivante ▶</button>
<button type="button" class="btn-map-ctrl" id="btnRealGps" onclick="toggleRealGps()" aria-pressed="false">📍 Suivre ma position</button>
<a class="btn-map-ctrl" id="trackerGmapsBtn" target="_blank" rel="noopener" href="#">🧭 Google Maps</a></div>
<div class="m2-chips" id="m2Chips" role="group" aria-label="Étapes du jour"></div>
<p id="trackerCurrentDesc" class="step-desc" style="margin:8px 0 0"></p><div id="trackerNextInfo" class="m2-next"></div>
<ol class="m2-list" id="m2List" aria-label="Programme du jour"></ol>
<details class="m2-more"><summary>Plus d'options</summary>
<button type="button" class="btn-map-ctrl" id="btnAutoPlay" onclick="toggleAutoPlay()">▶ Animer le parcours</button>
<button type="button" class="btn-map-ctrl" id="btnOffline" onclick="saveMapOffline()">📥 Sauver la carte du jour hors-ligne</button></details></div></div></div></div>`;
const M = $('#m2'), sheetEl = $('#m2Sheet'), ctlEl = $('#m2Ctl'), mapEl = $('#voyageMap');

/* ---------- carte ---------- */
const meIcon = L.divIcon({ className: '', html: '<div class="m2-me nohead"><div class="m2-cone"></div><div class="m2-dot"></div></div>', iconSize: [60, 60], iconAnchor: [30, 30] });
window.initOrUpdateMap = () => {
  if (!mapInstance) {
    mapInstance = L.map('voyageMap', { zoomControl: false, minZoom: 4, maxZoom: 20, zoomSnap: .5, zoomDelta: 1, wheelPxPerZoomLevel: 70, bounceAtZoomLimits: false, inertia: !calm, zoomAnimation: !calm, fadeAnimation: !calm, markerZoomAnimation: !calm }).setView([56.9489, 24.1064], 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 20, maxNativeZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(mapInstance);
    L.control.scale({ imperial: false, position: 'bottomleft' }).addTo(mapInstance);
    mapInstance.on('dragstart', () => { follow = false; cam = 'free'; ui(); });
    mapInstance.on('click', () => { if (ph && st !== 'peek') setState('peek'); });
    mapEl.addEventListener('pointerdown', e => { const x0 = e.clientX, y0 = e.clientY; const mv = ev => { if (Math.hypot(ev.clientX - x0, ev.clientY - y0) > 10) { if (cam !== 'me') cam = 'free'; off(); } }, up = () => off(), off = () => { removeEventListener('pointermove', mv, true); removeEventListener('pointerup', up, true); removeEventListener('pointercancel', up, true); }; addEventListener('pointermove', mv, true); addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true); }, { passive: true });
  }
  setTimeout(() => { mapInstance.invalidateSize(); drawDayOnMap(); }, 120);
};

/* ---------- caméra : tient compte de la barre du haut et du panneau du bas ---------- */
function pads() {
  if (!ph || !snaps) return { tl: [70, 70], br: [70, 70] };
  const top = $('#m2Top').getBoundingClientRect(), mr = M.getBoundingClientRect();
  const t = Math.max(0, top.bottom - mr.top) + 14 + (M.classList.contains('days-open') ? 64 : 0);
  return { tl: [28, t], br: [28, (snaps.vis[st] || 0) + 14] };
}
function centerFor(ll, z) {
  const P = pads(), off = ph ? (P.tl[1] - P.br[1]) / 2 : 0; ll = L.latLng(ll);
  if (!off) return ll; return mapInstance.unproject(mapInstance.project(ll, z).subtract([0, off]), z);
}
function focusOn(ll, z, animate) { if (!mapInstance) return; z = z == null ? mapInstance.getZoom() : z; mapInstance.stop(); mapInstance.setView(centerFor(ll, z), z, { animate: !!animate && !calm }); }
function fitPts(pts, maxZoom, animate) { if (!mapInstance || !pts.length) return; const P = pads(); mapInstance.stop(); mapInstance.fitBounds(L.latLngBounds(pts), { paddingTopLeft: P.tl, paddingBottomRight: P.br, maxZoom: maxZoom || 17, animate: !!animate && !calm }); }
function fitMeTarget(animate = true) { const t = target(); if (!me || !t) return; fitPts([[me.lat, me.lng], [t.lat, t.lng]], 17, animate); }
function fitDay(animate = true) {
  let b = null; try { b = routePolyline && routePolyline.getBounds ? routePolyline.getBounds() : null; } catch (e) {}
  if (!b || !b.isValid()) b = L.latLngBounds(day().steps.map(s => [s.lat, s.lng]));
  fitPts([b.getSouthWest(), b.getNorthEast()], 15, animate);
}
function frameStep(pi) {
  if (!ph || !mapInstance) return; const d = day(), t = target(), p = pi != null ? d.steps[pi] : null;
  if (p && p !== t && hav(p, t) < 60) fitPts([[p.lat, p.lng], [t.lat, t.lng]], 16, true); else focusOn([t.lat, t.lng], 15, true);
}
function reframe(animate) {
  if (!ph || !mapInstance) return;
  try {
    if (cam === 'me' && me) focusOn([me.lat, me.lng], Math.max(mapInstance.getZoom(), 17), animate);
    else if (cam === 'both' && me) fitMeTarget(animate);
    else if (cam === 'day') fitDay(animate);
    else if (cam === 'step') { const t = target(); focusOn([t.lat, t.lng], mapInstance.getZoom(), animate); }
  } catch (e) {}
}

/* ---------- panneau glissant ---------- */
function place(v) {
  curVis = v; const t = `translate3d(0,${-Math.round(v)}px,0)`;
  sheetEl.style.transform = `translate3d(0,${Math.round(snaps.sh - v)}px,0)`; ctlEl.style.transform = t;
  $$('.leaflet-bottom', mapEl).forEach(e => e.style.transform = t); const rs = $('#routeStat'); if (rs) rs.style.transform = t;
}
function unplace() { curVis = 0; sheetEl.style.transform = sheetEl.style.height = ctlEl.style.transform = ''; $$('.leaflet-bottom', mapEl).forEach(e => e.style.transform = ''); const rs = $('#routeStat'); if (rs) rs.style.transform = ''; }
function layout() {
  if (!ph || dg) return;
  const H = M.clientHeight || innerHeight, pb = parseFloat(getComputedStyle(sheetEl).paddingBottom) || 0, grab = $('#m2Grab').offsetHeight, peek = $('#m2Peek').offsetHeight;
  const bin = $('#m2BodyIn'), chips = $('#m2Chips'), natural = grab + peek + bin.offsetHeight + pb + 14, sh = Math.min(Math.round(natural), Math.round(H * .88));
  const vPeek = Math.min(sh, grab + peek + pb + 4);
  let vHalf = grab + peek + chips.offsetTop + chips.offsetHeight + pb + 12; vHalf = Math.min(vHalf, Math.round(H * .56), sh); if (vHalf < vPeek + 40) vHalf = Math.min(sh, vPeek + 40);
  snaps = { sh, vis: { peek: vPeek, half: vHalf, full: sh } }; sheetEl.style.height = sh + 'px'; place(snaps.vis[st]);
}
const schedLayout = () => { if (ph) { cancelAnimationFrame(lt); lt = requestAnimationFrame(layout); } };
function setState(n, quiet) {
  if (!snaps) return; st = n; M.classList.remove('st-peek', 'st-half', 'st-full'); M.classList.add('st-' + n);
  $('#m2Body').inert = n === 'peek'; $('#m2Grab').setAttribute('aria-expanded', String(n !== 'peek'));
  place(snaps.vis[n]); if (!quiet) buzz(6);
  setTimeout(() => reframe(true), calm ? 0 : 330);
}
const nearest = v => ['peek', 'half', 'full'].reduce((a, k) => Math.abs(snaps.vis[k] - v) < Math.abs(snaps.vis[a] - v) ? k : a, 'peek');
$('#m2Grab').onclick = () => setState(st === 'peek' ? 'half' : st === 'half' ? 'full' : 'peek');
sheetEl.addEventListener('pointerdown', e => {
  if (!ph || !snaps || (e.pointerType === 'mouse' && e.button !== 0)) return;
  dg = { id: e.pointerId, x: e.clientX, y: e.clientY, vis0: curVis, from: st, axis: null, s: [[performance.now(), e.clientY]], peek: !!e.target.closest('#m2Peek') };
});
sheetEl.addEventListener('pointermove', e => {
  if (!dg || e.pointerId !== dg.id) return;
  const dx = e.clientX - dg.x, dy = e.clientY - dg.y;
  if (!dg.axis) { if (Math.hypot(dx, dy) < 8) return; dg.axis = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h'; if (dg.axis === 'v') { try { sheetEl.setPointerCapture(e.pointerId); } catch (_) {} M.classList.add('drag'); } }
  if (dg.axis !== 'v') return;
  const now = performance.now(); dg.s.push([now, e.clientY]); while (dg.s.length > 2 && now - dg.s[0][0] > 120) dg.s.shift();
  place(clamp(dg.vis0 - dy, snaps.vis.peek - 28, snaps.vis.full));
});
function endDrag(e) {
  if (!dg || (e && e.pointerId !== dg.id)) return; const d = dg; dg = null; M.classList.remove('drag');
  if (d.axis === 'v') {
    const a = d.s[0], b = d.s[d.s.length - 1], v = (a[1] - b[1]) / Math.max(1, b[0] - a[0]), order = ['peek', 'half', 'full'];
    let k = nearest(curVis + v * 180); if (Math.abs(v) > .5 && k === d.from) k = order[clamp(order.indexOf(k) + (v > 0 ? 1 : -1), 0, 2)];
    setState(k);
  } else if (d.axis === 'h' && d.peek && e && e.type === 'pointerup') { const dx = e.clientX - d.x; if (Math.abs(dx) > 56) { buzz(8); moveCoupleStep(dx < 0 ? 1 : -1); } }
}
sheetEl.addEventListener('pointerup', endDrag); sheetEl.addEventListener('pointercancel', endDrag);
sheetEl.addEventListener('focusin', e => { if (ph && st !== 'full' && e.target.closest('#m2Body') && e.target.matches(':focus-visible')) setState('full', true); });
if ('ResizeObserver' in window) { const ro = new ResizeObserver(schedLayout); ro.observe($('#m2Peek')); ro.observe($('#m2BodyIn')); }
const onResize = () => { if (!ph) return; layout(); mapInstance && mapInstance.invalidateSize(); reframe(false); };
addEventListener('resize', onResize); addEventListener('orientationchange', () => setTimeout(onResize, 250));

/* ---------- plein écran (le bouton retour du téléphone le ferme aussi) ---------- */
const tc = $('meta[name="theme-color"]');
function theme(on) { if (!tc) return; if (on) { themeOld = tc.getAttribute('content'); tc.setAttribute('content', '#EFE8DD'); } else if (themeOld) { tc.setAttribute('content', themeOld); themeOld = null; } }
function setFull(on) {
  if (!M || on === !!ph) return;
  if (on) {
    ph = document.createElement('div'); ph.style.height = M.offsetHeight + 'px'; M.replaceWith(ph); document.body.appendChild(M);
    M.classList.add('full', 'st-peek'); M.setAttribute('role', 'dialog'); M.setAttribute('aria-modal', 'true'); M.setAttribute('aria-label', 'Carte en plein écran');
    document.documentElement.classList.add('m2-lock'); document.body.classList.add('m2-lock'); history.pushState({ m2: 1 }, ''); theme(true);
    st = 'peek'; cam = me && follow ? 'me' : 'step'; listKey = ''; sheet(); layout(); $('#m2Body').inert = true; $('#m2Grab').setAttribute('aria-expanded', 'false'); $('#m2Close').focus({ preventScroll: true });
  } else {
    dg = null; M.classList.remove('full', 'drag', 'days-open', 'st-peek', 'st-half', 'st-full'); M.setAttribute('role', 'region'); M.setAttribute('aria-label', 'Carte et navigation'); M.removeAttribute('aria-modal');
    ph.replaceWith(M); ph = null; document.documentElement.classList.remove('m2-lock'); document.body.classList.remove('m2-lock'); theme(false);
    $('#m2Body').inert = false; unplace(); $('#m2DayBtn').setAttribute('aria-expanded', 'false'); $('#m2Full').focus({ preventScroll: true });
  }
  ui(); setTimeout(() => { if (!mapInstance) return; mapInstance.invalidateSize({ animate: false }); if (ph) { layout(); reframe(false); } }, 60);
}
const exitFull = () => { if (history.state && history.state.m2) history.back(); else setFull(false); };
addEventListener('popstate', () => { if (ph) setFull(false); });
addEventListener('keydown', e => {
  if (!ph) return;
  if (e.key === 'Escape') { exitFull(); return; }
  if (e.key !== 'Tab') return;
  const f = $$('button,a[href],summary,input,[tabindex="0"]', M).filter(x => !x.disabled && !x.hidden && x.getClientRects().length && !x.closest('[inert]'));   // le focus reste dans la carte
  if (!f.length) return; const a = f[0], z = f[f.length - 1];
  if (e.shiftKey && (document.activeElement === a || !M.contains(document.activeElement))) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
});

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
function say(m) { $('#m2Turn').textContent = m; schedLayout(); }
function startLive() {
  if (!navigator.geolocation) return say('Géolocalisation indisponible sur cet appareil.');
  if (liveId !== null) return;
  askCompass(); wakeOn(); follow = true; first = true; cam = 'me';
  liveId = navigator.geolocation.watchPosition(onPos, er => { stopLive(); say(er.code === 1 ? 'Localisation refusée : autorisez-la dans les réglages du navigateur.' : 'Position introuvable pour le moment, réessayez dehors.'); }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
  gpsWatchId = liveId; say('Recherche de votre position…'); ui();
}
function stopLive() {
  if (liveId !== null) navigator.geolocation.clearWatch(liveId); liveId = null; gpsWatchId = null;
  removeEventListener('deviceorientationabsolute', onOri, true); removeEventListener('deviceorientation', onOri, true); wakeOff();
  if (meMk) { mapInstance.removeLayer(meMk); mapInstance.removeLayer(meCi); } meMk = meCi = null; me = null; heading = null; follow = false; if (cam === 'me' || cam === 'both') cam = 'step';
  clearGuide(); $('#m2Arrow').hidden = true; $('#m2Head').hidden = true; ui(); sheet();
}
function onPos(p) {
  const c = p.coords; me = { lat: c.latitude, lng: c.longitude, acc: c.accuracy }; const ll = [me.lat, me.lng];
  if (Date.now() - lastOri > 3000 && c.heading != null && !isNaN(c.heading) && c.speed > 1) heading = c.heading;
  if (!meMk) { meMk = L.marker(ll, { icon: meIcon, interactive: false, keyboard: false, zIndexOffset: 2000 }).addTo(mapInstance); meCi = L.circle(ll, { radius: me.acc, color: '#1A73E8', weight: 1, fillOpacity: .1, interactive: false }).addTo(mapInstance); }
  else { meMk.setLatLng(ll); meCi.setLatLng(ll).setRadius(me.acc); }
  if (first) { first = false; say(''); if (hav(me, target()) > 25) { cam = 'me'; ph ? focusOn(ll, 16, false) : mapInstance.setView(ll, 16); } else { cam = 'both'; fitMeTarget(); } }
  else if (follow) { if (ph) { const z = mapInstance.getZoom(); mapInstance.setView(centerFor(ll, z), z, { animate: false }); } else mapInstance.panTo(ll, { animate: false }); }
  paintHeading(); sheet(); guide(false);
}

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
  $('#m2Chips').innerHTML = d.steps.map((s, i) => `<button type="button" class="m2-chip" data-i="${i}" aria-label="Étape ${i + 1} : ${esc(s.title)}"><b>${i + 1}</b><span>${esc(s.title)}</span></button>`).join('');
  listKey = ''; schedLayout();
}
function renderList() {
  const d = day(), key = d.id + '|' + mapCurrentStepIdx + '|' + d.steps.map(s => checkedSteps[s.id] ? 1 : 0).join(''); if (key === listKey) return; listKey = key;
  $('#m2List').innerHTML = d.steps.map((s, i) => `<li><button type="button" class="m2-li${i === mapCurrentStepIdx ? ' on' : ''}${checkedSteps[s.id] ? ' done' : ''}" data-i="${i}"${i === mapCurrentStepIdx ? ' aria-current="step"' : ''}><b>${i + 1}</b><span class="t">${esc(s.time)}</span><span class="n">${esc(s.title)}</span>${checkedSteps[s.id] ? '<i aria-hidden="true">✓</i><span class="sr-only" style="position:absolute;left:-9999px">fait</span>' : ''}</button></li>`).join('');
}
function sheet() {
  const t = target(); if (!t) return; const d = day();
  $$('#m2Chips .m2-chip').forEach((b, i) => { const a = i === mapCurrentStepIdx; b.classList.toggle('on', a); a ? b.setAttribute('aria-current', 'step') : b.removeAttribute('aria-current'); });
  renderList();
  $('#m2DayTxt').textContent = `${d.shortLabel} · ${d.subLabel}`; $('#m2StepTxt').textContent = `Étape ${mapCurrentStepIdx + 1}/${d.steps.length} · ${t.time}`;
  const g = $('#trackerGmapsBtn'), far = me && hav(me, t) > 3;
  g.href = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(t.q || t.lat + ',' + t.lng)}&travelmode=${far ? 'transit' : 'walking'}`;
  g.textContent = far ? '🚌 Itinéraire transports' : '🧭 Google Maps à pied';
  if (!me) { $('#m2Stat').textContent = t.price ? '💶 ' + t.price : ''; $('#m2Done').hidden = true; schedLayout(); return; }
  paintArrow();
  const near = hav(me, t) * 1000 < 30; $('#m2Done').hidden = !near;
  if (near && arrivedFor !== t.id) { arrivedFor = t.id; say('Vous êtes arrivé à ' + t.title); }
  schedLayout();
}
function ui() {
  const live = liveId !== null, b = $('#btnRealGps');
  b.textContent = live ? '📡 Suivi actif (arrêter)' : '📍 Suivre ma position'; b.setAttribute('aria-pressed', live); b.classList.toggle('gps-active', live);
  const m = $('#m2Me'); m.classList.toggle('on', live && follow); m.classList.toggle('live', live && !follow);
  m.setAttribute('aria-pressed', String(live && follow)); m.setAttribute('aria-label', !live ? 'Me localiser et suivre ma position' : follow ? 'Suivi de ma position actif' : 'Recentrer sur ma position');
  $('#m2Full').setAttribute('aria-label', ph ? 'Quitter le plein écran' : 'Plein écran');
}

/* ---------- branchements ---------- */
window.toggleRealGps = () => liveId !== null ? stopLive() : startLive();
window.stopRealGps = () => {};                       // l'ancien code l'appelait à chaque changement d'étape : le suivi reste maintenant actif
const _u = window.updateCouplePositionOnProgram;
window.updateCouplePositionOnProgram = function (f) {
  const pd = lastDay, pi = lastIdx;
  _u.apply(this, arguments); if (chipsDay !== mapCurrentDayId) renderChips();
  clearGuide(); lastKey = ''; arrivedFor = null; if (!me) say('');
  if (me) { cam = 'both'; if (!f) fitMeTarget(); else if (ph) frameStep(null); guide(true); }
  else if (ph) { cam = 'step'; frameStep(pd === mapCurrentDayId && !f ? pi : null); }
  lastDay = mapCurrentDayId; lastIdx = mapCurrentStepIdx; sheet();
};
const _fd = window.fitDayOnMap;
window.fitDayOnMap = () => { follow = false; cam = 'day'; ui(); if (ph) { stopAutoPlay(); fitDay(true); } else if (_fd) _fd(); };
const _sd = window.selectMapDay;
window.selectMapDay = function () { const r = _sd.apply(this, arguments); M.classList.remove('days-open'); $('#m2DayBtn').setAttribute('aria-expanded', 'false'); return r; };
$('#m2In').onclick = () => mapInstance && mapInstance.zoomIn(1);
$('#m2Out').onclick = () => mapInstance && mapInstance.zoomOut(1);
$('#m2Me').onclick = () => { if (liveId === null) return startLive(); follow = true; cam = 'me'; if (me) focusOn([me.lat, me.lng], Math.max(mapInstance.getZoom(), 17), true); ui(); };
$('#m2Both').onclick = () => { if (!me) { startLive(); return; } follow = false; cam = 'both'; ui(); fitMeTarget(); };
$('#m2Fit').onclick = () => fitDayOnMap();
$('#m2Full').onclick = () => setFull(true);
$('#m2Close').onclick = () => exitFull();
$('#m2DayBtn').onclick = () => { const o = M.classList.toggle('days-open'); $('#m2DayBtn').setAttribute('aria-expanded', String(o)); };
$('#m2Prev').onclick = () => moveCoupleStep(-1);
$('#m2Next').onclick = () => moveCoupleStep(1);
$('#m2Done').onclick = () => { const t = target(); if (!checkedSteps[t.id]) toggleStep(t.id); moveCoupleStep(1); };
const pick = e => { const b = e.target.closest('[data-i]'); if (!b) return; stopAutoPlay(); mapCurrentStepIdx = +b.dataset.i; updateCouplePositionOnProgram(false); if (b.classList.contains('m2-chip')) b.scrollIntoView({ inline: 'center', block: 'nearest' }); else if (ph) setState('peek'); };
$('#m2Chips').onclick = pick; $('#m2List').onclick = pick;
renderMapDaySelector(); renderChips(); sheet(); ui();
})();
