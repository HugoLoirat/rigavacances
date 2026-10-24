/* extras.js — Carnet Riga & Stockholm
   A. Synchro automatique des coches entre vos deux téléphones (ntfy.sh, sans compte, sans QR code)
   B. Golden hour / coucher de soleil calculés sur place (marche hors-ligne)
   C. Glisser gauche/droite pour changer de jour
   D. Mini intro à la première ouverture
   E. Réglages (taille du texte, calme, écran allumé) + accessibilité et confort mobile */
(() => {
'use strict';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = { get: (k, d = null) => { try { const v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };
const OS_CALM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const calm = () => OS_CALM || store.get('rs_calm') === '1';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* heure « simulée » : ajoutez ?t=2026-10-27T14:50 à l'adresse pour prévisualiser un jour du voyage */
const DEMO = (() => { const m = /[?&]t=([^&]+)/.exec(location.search); if (!m) return 0; const d = new Date(decodeURIComponent(m[1])); return isNaN(d) ? 0 : d - Date.now(); })();
const now = () => new Date(Date.now() + DEMO);

/* ================= styles ================= */
const css = document.createElement('style');
css.textContent = `
html { -webkit-text-size-adjust: 100%; }
body { overscroll-behavior-y: contain; }
button, a, input, select, summary, .day-pill, .nav-btn { touch-action: manipulation; }
:focus-visible { outline: 3px solid var(--accent-terra); outline-offset: 2px; border-radius: 8px; }
.step-time { color: var(--accent-terra-dark); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.hero-off .hero-header::before, .hero-off .hero-header::after { animation-play-state: paused; }

/* statut de synchro */
.sync-stat { display: flex; width: 100%; min-height: 44px; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; padding: 8px 14px;
  border: 1px solid rgba(255,255,255,.22); border-radius: 14px; background: rgba(255,255,255,.12); color: #FAF5EE; font: 600 .8rem/1.3 inherit; font-family: inherit; text-align: left; cursor: pointer; }
.sync-stat:active { transform: scale(.98); }

/* toasts */
#xToast { position: fixed; top: calc(env(safe-area-inset-top, 0px) + 12px); left: 50%; transform: translateX(-50%); z-index: 9700; width: min(94vw, 480px); display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
.x-t { background: rgba(35, 28, 24, .92); color: #fff; padding: 12px 16px; border-radius: 16px; font-size: .86rem; font-weight: 600; box-shadow: 0 12px 30px rgba(0,0,0,.28);
  animation: xIn .45s var(--smooth) both; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
.x-t.out { animation: xOut .35s ease both; }
@keyframes xIn { from { opacity: 0; transform: translateY(-14px) scale(.96); } to { opacity: 1; transform: none; } }
@keyframes xOut { to { opacity: 0; transform: translateY(-10px) scale(.97); } }

/* golden hour */
.golden-strip { margin: 0 0 12px; padding: 11px 13px; border-radius: 14px; border-left: 4px solid var(--accent-gold);
  background: linear-gradient(100deg, #FFF3D6 0%, #FDE7DC 100%); color: #5B3A12; font-size: .82rem; line-height: 1.45; }
.golden-strip b { color: var(--accent-terra-dark); }
.golden-strip .g-sub { color: #7A5A33; font-size: .78rem; margin-top: 3px; }
.golden-strip .g-live { display: inline-block; margin-top: 6px; padding: 4px 10px; border-radius: 99px; background: var(--accent-terra); color: #fff; font-weight: 700; font-size: .76rem; }
.golden-strip button { margin-top: 8px; min-height: 40px; padding: 8px 14px; border: 0; border-radius: 12px; background: #fff; color: var(--accent-terra-dark); font: 700 .8rem inherit; font-family: inherit; box-shadow: 0 2px 8px rgba(200,90,50,.18); cursor: pointer; }
#goldenPill { position: fixed; left: 50%; bottom: calc(112px + env(safe-area-inset-bottom, 0px)); transform: translate(-50%, 30px); opacity: 0; z-index: 9400; width: min(92vw, 470px);
  display: flex; align-items: center; gap: 10px; padding: 10px 12px 10px 16px; border-radius: 20px; color: #fff; font-size: .84rem; font-weight: 700;
  background: linear-gradient(110deg, #C85A32, #D49B35); box-shadow: 0 14px 34px rgba(200,90,50,.45); transition: transform .5s var(--smooth), opacity .4s; pointer-events: none; }
#goldenPill.on { transform: translate(-50%, 0); opacity: 1; pointer-events: auto; }
#goldenPill span { flex: 1; }
#goldenPill button { min-height: 40px; min-width: 40px; border: 0; border-radius: 12px; background: rgba(255,255,255,.22); color: #fff; font: 700 .8rem inherit; font-family: inherit; padding: 0 12px; cursor: pointer; }

/* glisser pour changer de jour */
#daysContainer { touch-action: pan-y pinch-zoom; will-change: transform; }
#dayMark { position: fixed; inset: 0; display: grid; place-content: center; text-align: center; z-index: 9300; pointer-events: none; opacity: 0; }
#dayMark b { display: block; font-family: 'Fraunces', Georgia, serif; font-size: clamp(4.5rem, 26vw, 8rem); line-height: 1; color: rgba(45, 90, 76, .16); }
#dayMark i { display: block; font-style: normal; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: rgba(45, 90, 76, .55); font-size: .9rem; margin-top: 6px; }
#dayMark.go { animation: markPop 1s var(--smooth) both; }
@keyframes markPop { 0% { opacity: 0; transform: scale(.82); } 25% { opacity: 1; transform: scale(1); } 100% { opacity: 0; transform: scale(1.1); } }

/* fiche réglages */
#sheetBack { position: fixed; inset: 0; z-index: 9800; background: rgba(20, 16, 14, .45); opacity: 0; pointer-events: none; transition: opacity .3s; }
#sheetBack.on { opacity: 1; pointer-events: auto; }
#sheet { position: fixed; left: 50%; bottom: 0; width: min(100%, 540px); max-height: 88vh; overflow-y: auto; z-index: 9900; transform: translate(-50%, 105%); transition: transform .45s var(--smooth);
  background: var(--bg-paper); border-radius: 26px 26px 0 0; padding: 14px 18px calc(24px + env(safe-area-inset-bottom, 0px)); box-shadow: 0 -16px 50px rgba(0,0,0,.25); }
#sheet.on { transform: translate(-50%, 0); }
#sheet .grab { width: 44px; height: 5px; border-radius: 5px; background: #D9CBBD; margin: 0 auto 14px; }
#sheet h2 { font-size: 1.2rem; margin-bottom: 4px; }
#sheet h3 { font-family: inherit; font-size: .8rem; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin: 18px 0 8px; }
#sheet .seg { display: flex; gap: 8px; }
#sheet .seg button, #sheet .row-btn { flex: 1; min-height: 48px; border-radius: 14px; border: 1.5px solid var(--border-soft); background: #fff; color: var(--text-main); font: 700 .9rem inherit; font-family: inherit; cursor: pointer; }
#sheet .seg button[aria-pressed="true"] { background: var(--accent-forest); border-color: var(--accent-forest); color: #fff; }
#sheet .row-btn { width: 100%; text-align: left; padding: 0 14px; margin-top: 8px; display: flex; align-items: center; justify-content: space-between; }
#sheet .row-btn[aria-pressed="true"] .sw { background: var(--accent-forest); }
#sheet .row-btn[aria-pressed="true"] .sw::after { transform: translateX(20px); }
#sheet .sw { width: 46px; height: 26px; border-radius: 26px; background: #CBBBAA; position: relative; flex: none; transition: background .25s; }
#sheet .sw::after { content: ""; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform .25s var(--smooth); }
#sheet input[type=text] { width: 100%; min-height: 48px; border: 1.5px solid var(--border-soft); border-radius: 14px; padding: 0 14px; font: 600 .9rem inherit; font-family: monospace; background: #fff; color: var(--text-main); }
#sheet .note { font-size: .78rem; color: var(--text-muted); margin-top: 6px; }
#sheet .close { width: 100%; min-height: 50px; margin-top: 18px; border: 0; border-radius: 16px; background: var(--accent-terra); color: #fff; font: 700 .95rem inherit; font-family: inherit; cursor: pointer; }

/* intro */
#intro { position: fixed; inset: 0; z-index: 20000; overflow: hidden; color: #FAF5EE; display: flex; flex-direction: column; justify-content: flex-end;
  background: radial-gradient(120% 80% at 50% 30%, #2D5A4C 0%, #1B3B32 55%, #0F2019 100%); transition: opacity .7s ease, transform .9s var(--smooth); }
#intro.out { opacity: 0; transform: scale(1.12); pointer-events: none; }
#intro .in-skip { position: absolute; top: calc(env(safe-area-inset-top, 0px) + 10px); right: 12px; min-height: 44px; min-width: 44px; padding: 0 16px; border: 0; border-radius: 22px; background: rgba(255,255,255,.14); color: #fff; font: 600 .85rem inherit; font-family: inherit; z-index: 3; cursor: pointer; }
#intro svg { position: absolute; inset: 0; width: 100%; height: 100%; }
#intro .st { fill: #fff; opacity: .5; }
#intro .tw { animation: tw 3s ease-in-out infinite; }
@keyframes tw { 50% { opacity: .1; } }
#intro .city { opacity: 0; transform-box: fill-box; transform-origin: center; transform: scale(.3); transition: opacity .6s, transform .8s var(--spring); }
#intro .city.on { opacity: 1; transform: scale(1); }
#intro .ring { fill: none; stroke: #F4B961; stroke-width: 1.5; opacity: 0; transform-box: fill-box; transform-origin: center; }
#intro .city.on .ring { animation: ring 2.4s ease-out infinite; }
@keyframes ring { 0% { opacity: .8; transform: scale(.4); } 100% { opacity: 0; transform: scale(2.6); } }
#intro .lbl { font: 700 15px 'Fraunces', Georgia, serif; fill: #FAF5EE; }
#intro .box { position: relative; z-index: 2; padding: 0 24px calc(34px + env(safe-area-inset-bottom, 0px)); text-align: center; }
#intro h1 { font-size: clamp(2rem, 9vw, 2.7rem); line-height: 1.1; opacity: 0; transform: translateY(18px); transition: opacity .8s, transform .9s var(--smooth); }
#intro p.sub { opacity: 0; margin-top: 8px; color: #D7E6DF; transition: opacity .8s .15s; font-size: 1rem; }
#intro .who { opacity: 0; transform: translateY(14px); transition: opacity .7s, transform .8s var(--smooth); margin-top: 22px; }
#intro .who p { font-size: .9rem; color: #D7E6DF; margin-bottom: 10px; }
#intro .who .seg { display: flex; gap: 10px; }
#intro .who button { flex: 1; min-height: 56px; border: 0; border-radius: 18px; font: 700 1.05rem inherit; font-family: inherit; background: #FAF5EE; color: #1B3B32; cursor: pointer; box-shadow: 0 8px 22px rgba(0,0,0,.25); }
#intro .who button.go { background: var(--accent-terra); color: #fff; }
#intro .on { opacity: 1 !important; transform: none !important; }
`;
document.head.appendChild(css);

/* ================= toasts + annonce lecteur d'écran ================= */
document.body.insertAdjacentHTML('beforeend', '<div id="xToast" role="status" aria-live="polite"></div><div id="xLive" class="sr-only" aria-live="polite"></div>');
function toast(msg, ms = 3400) {
  const box = $('#xToast'); if (!box) return;
  const t = document.createElement('div'); t.className = 'x-t'; t.textContent = msg; box.appendChild(t);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 380); }, ms);
}
const announce = m => { const l = $('#xLive'); if (l) { l.textContent = ''; setTimeout(() => l.textContent = m, 60); } };
const vibrate = n => { try { navigator.vibrate && navigator.vibrate(n); } catch (e) {} };

/* ================= identité ================= */
const who = () => store.get('rs_who', '');
const partnerName = () => who() === 'Hugo' ? 'Camille' : who() === 'Camille' ? 'Hugo' : store.get('rs_partner', '');

/* ================= A. synchro des coches ================= */
const BASE = 'https://ntfy.sh';
const ROOM_DEFAULT = 'carnet-riga-stockholm-x789stg2933cx4';
const room = () => (store.get('rs_room') || ROOM_DEFAULT).trim();
const DEV = (() => { let d = store.get('rs_dev'); if (!d) { d = Math.random().toString(36).slice(2, 10); store.set('rs_dev', d); } return d; })();
let ts = {}; try { ts = JSON.parse(store.get('rs_sync_ts', '{}')) || {}; } catch (e) {}
const saveTs = () => store.set('rs_sync_ts', JSON.stringify(ts));
const nowSec = () => Math.floor(Date.now() / 1000);
const stepTitle = id => { for (const d of itineraryData) { const s = d.steps.find(x => x.id === id); if (s) return s.title; } return 'une étape'; };

function encode() {
  const ids = new Set(Object.keys(ts)); Object.keys(checkedSteps).forEach(k => { if (checkedSteps[k]) ids.add(k); });
  return [...ids].map(id => `${id}.${(ts[id] || 0).toString(36)}.${checkedSteps[id] ? 1 : 0}`).join(',');
}
function decode(s) { return String(s || '').split(',').filter(Boolean).map(p => { const a = p.split('.'); return { id: a[0], t: parseInt(a[1], 36) || 0, v: a[2] === '1' ? 1 : 0 }; }); }

function applyRemote(entries) {
  const changed = []; let localNewer = false; const seen = new Set();
  entries.forEach(({ id, t, v }) => {
    seen.add(id); const lt = ts[id] || 0, cur = checkedSteps[id] ? 1 : 0;
    if (t > lt || (t === lt && v === 1 && cur === 0)) { if (v !== cur) { checkedSteps[id] = !!v; changed.push({ id, v }); } ts[id] = t; }
    else if (lt > t || (t === lt && cur !== v)) localNewer = true;
  });
  Object.keys(checkedSteps).forEach(k => { if (checkedSteps[k] && !seen.has(k)) localNewer = true; });
  if (changed.length) {
    store.set(STORAGE_CHECKS, JSON.stringify(checkedSteps));
    changed.forEach(({ id, v }) => { const row = document.getElementById('row_' + id); if (row) { row.classList.toggle('done', !!v); const c = $('input.step-checkbox', row); if (c) c.checked = !!v; } });
    saveTs(); try { updateGlobalProgress(); } catch (e) {}
  }
  return { changed, localNewer };
}

/* publication (regroupée, avec reprise) */
let pubTimer = null, pubPending = false, lastRemote = null, sync = 'connecting';
function schedulePublish(delay = 700) { pubPending = true; clearTimeout(pubTimer); pubTimer = setTimeout(publish, delay); }
async function publish() {
  if (!navigator.onLine) { setSync('off'); return; }
  try {
    const r = await fetch(`${BASE}/${room()}`, { method: 'POST', body: JSON.stringify({ v: 1, n: who(), d: DEV, s: encode() }) });
    if (!r.ok) throw new Error('http'); pubPending = false; setSync('ok');
  } catch (e) { setSync('err'); schedulePublish(10000); }
}
function handleMsg(raw, live) {
  let b; try { b = JSON.parse(raw); } catch (e) { return { changed: [] }; }
  if (!b || b.d === DEV) return { changed: [] };
  if (b.n) store.set('rs_partner', b.n);
  const { changed, localNewer } = applyRemote(decode(b.s));
  lastRemote = { n: b.n || partnerName() || 'Votre moitié', t: Date.now() };
  if (changed.length && live) {
    const c = changed[0], extra = changed.length > 1 ? ` (+${changed.length - 1})` : '';
    toast(`💑 ${lastRemote.n} a ${c.v ? 'coché' : 'décoché'} « ${stepTitle(c.id)} »${extra}`); vibrate(12);
  }
  if (localNewer) schedulePublish(1500);
  paintSync(); return { changed, name: lastRemote.n };
}
async function poll() {
  try {
    const r = await fetch(`${BASE}/${room()}/json?poll=1&since=all`); if (!r.ok) throw new Error('http');
    const lines = (await r.text()).split('\n').filter(Boolean); let n = 0, name = '';
    lines.forEach(l => { try { const o = JSON.parse(l); if (o.event === 'message') { const res = handleMsg(o.message, false); n += res.changed.length; if (res.name) name = res.name; } } catch (e) {} });
    if (n) toast(`💑 ${name} a mis à jour ${n} étape${n > 1 ? 's' : ''} depuis ta dernière visite`);
    setSync('ok'); if (pubPending) publish();
  } catch (e) { setSync(navigator.onLine ? 'err' : 'off'); }
}
let es = null, sseOk = false;
function openLive() {
  if (!('EventSource' in window)) return; try { if (es) es.close(); } catch (e) {}
  es = new EventSource(`${BASE}/${room()}/sse`);
  es.addEventListener('open', () => { if (sseOk) poll(); sseOk = true; });
  es.addEventListener('message', ev => { try { const o = JSON.parse(ev.data); if (o.event === 'message') handleMsg(o.message, true); } catch (e) {} });
  es.addEventListener('error', () => { sseOk = false; });
}
function startSync() {
  openLive(); poll(); if (Object.keys(checkedSteps).some(k => checkedSteps[k])) schedulePublish(2500);
  setInterval(() => { if (document.visibilityState === 'visible' && !sseOk) poll(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { poll(); if (!es || es.readyState === 2) openLive(); } });
  addEventListener('online', () => { poll(); if (pubPending) publish(); setSync('connecting'); });
  addEventListener('offline', () => setSync('off'));
  setInterval(paintSync, 30000);
}
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? "à l'instant" : m < 60 ? `il y a ${m} min` : `il y a ${Math.round(m / 60)} h`; };
function setSync(s) { sync = s; paintSync(); }
function paintSync() {
  const el = $('#syncTxt'); if (!el) return; const p = partnerName();
  el.textContent = sync === 'ok' ? `🔗 Synchro${p ? ' avec ' + p : ' active'}${lastRemote ? ' · ' + ago(lastRemote.t) : ''}`
    : sync === 'off' ? '📴 Hors-ligne · envoi au retour du réseau'
    : sync === 'err' ? '⚠️ Synchro indisponible · nouvel essai…' : '🔄 Connexion à la synchro…';
}
/* toggleStep : on date chaque coche puis on publie */
const _toggle = window.toggleStep;
window.toggleStep = function (id) { const r = _toggle.apply(this, arguments); ts[id] = nowSec(); saveTs(); schedulePublish(); vibrate(10); return r; };
$('.progress-meta').insertAdjacentHTML('afterend', '<button class="sync-stat" id="syncStat" aria-label="Synchronisation et réglages"><span id="syncTxt">🔄 Connexion à la synchro…</span><span aria-hidden="true">⚙️</span></button>');
$('#syncStat').addEventListener('click', () => openSheet());

/* ================= B. golden hour ================= */
const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI;
function sunEvent(y, m, d, lat, lng, alt, evening) {
  const JD = Date.UTC(y, m, d, 12) / 86400000 + 2440587.5, T = (JD - 2451545) / 36525;
  const L0 = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360, M = 357.52911 + T * (35999.05029 - 0.0001537 * T), e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T), Mr = rad(M);
  const C = Math.sin(Mr) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * Mr) * (0.019993 - 0.000101 * T) + Math.sin(3 * Mr) * 0.000289;
  const om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(rad(om));
  const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(rad(om));
  const decl = deg(Math.asin(Math.sin(rad(eps)) * Math.sin(rad(lam)))), y2 = Math.tan(rad(eps / 2)) ** 2;
  const eqt = 4 * deg(y2 * Math.sin(2 * rad(L0)) - 2 * e * Math.sin(Mr) + 4 * e * y2 * Math.sin(Mr) * Math.cos(2 * rad(L0)) - 0.5 * y2 * y2 * Math.sin(4 * rad(L0)) - 1.25 * e * e * Math.sin(2 * Mr));
  const cosH = (Math.sin(rad(alt)) - Math.sin(rad(lat)) * Math.sin(rad(decl))) / (Math.cos(rad(lat)) * Math.cos(rad(decl)));
  if (Math.abs(cosH) > 1) return null;
  const H = deg(Math.acos(cosH)), noon = 720 - 4 * lng - eqt;
  return new Date(Date.UTC(y, m, d) + (noon + (evening ? 4 : -4) * H) * 60000);
}
const PLACES = { riga: { lat: 56.9496, lng: 24.1052, tz: 'Europe/Riga' }, sto: { lat: 59.3293, lng: 18.0686, tz: 'Europe/Stockholm' } };
const dayPlace = id => ['j4', 'j5', 'j6', 'j7'].includes(id) ? PLACES.sto : PLACES.riga;
/* meilleur endroit du jour pour le coucher de soleil (étape existante du programme) */
const SPOTS = { j1: 'j1_s4', j3: 'j3_s2', j4: 'j4_s3', j5: 'j5_s5', j6: 'j6_s3', j8: 'j8_s2', j9: 'j9_s2' };
function dayDate(i) { const d = new Date(Date.UTC(2026, 9, 24) + i * 86400000); return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()]; }
function sunInfo(dayIdx) {
  const id = itineraryData[dayIdx].id, p = dayPlace(id), [y, m, d] = dayDate(dayIdx);
  const g = sunEvent(y, m, d, p.lat, p.lng, 6, true), s = sunEvent(y, m, d, p.lat, p.lng, -0.833, true), b = sunEvent(y, m, d, p.lat, p.lng, -6, true);
  return { id, p, g, s, b };
}
const hm = (dt, tz) => new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(dt).replace(':', 'h');
function spotOf(id) { const d = itineraryData.find(x => x.id === id), sid = SPOTS[id]; if (!d || !sid) return null; const i = d.steps.findIndex(s => s.id === sid); return i < 0 ? null : { i, title: d.steps[i].title }; }
function goldenHtml(dayIdx) {
  const I = sunInfo(dayIdx); if (!I.g || !I.s) return ''; const tz = I.p.tz, sp = spotOf(I.id);
  return `<div class="golden-strip" data-day="${I.id}" data-i="${dayIdx}"><div>🌇 Golden hour dès <b>${hm(I.g, tz)}</b> · coucher à <b>${hm(I.s, tz)}</b></div>
    <div class="g-sub">Heure bleue jusqu'à ${hm(I.b, tz)}${sp ? ' · Meilleur spot : ' + esc(sp.title) : ''}</div><div class="g-live" hidden></div>
    ${sp ? `<br><button type="button" data-go="${I.id}:${sp.i}">🧭 Voir ce spot sur la carte</button>` : ''}</div>`;
}
function dayIndexToday() { const n = now(), k = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`; for (let i = 0; i < itineraryData.length; i++) { const [y, m, d] = dayDate(i); if (`${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` === k) return i; } return -1; }
function liveGolden() {
  const ti = dayIndexToday(), pill = $('#goldenPill');
  $$('.golden-strip .g-live').forEach(e => e.hidden = true);
  if (ti < 0) { pill && pill.classList.remove('on'); return; }
  const I = sunInfo(ti); if (!I.g || !I.s) return; const t = now().getTime(), mg = Math.round((I.g - t) / 60000), ms = Math.round((I.s - t) / 60000);
  let txt = '';
  if (mg > 0 && mg <= 90) txt = `🌇 Golden hour dans ${mg >= 60 ? Math.floor(mg / 60) + ' h ' + String(mg % 60).padStart(2, '0') : mg + ' min'}`;
  else if (mg <= 0 && ms > 0) txt = `🌇 Golden hour en cours · coucher dans ${ms} min`;
  else if (ms <= 0 && (I.b - t) / 60000 > 0) txt = `🌌 Heure bleue : le ciel est magique, levez les yeux`;
  const strip = $(`.golden-strip[data-day="${I.id}"] .g-live`); if (strip) { strip.hidden = !txt; strip.textContent = txt; }
  const sp = spotOf(I.id), dismissed = sessionStorage.getItem('rs_gp_' + I.id) === '1';
  if (txt && !dismissed && (mg <= 60 || ms > 0)) {
    pill.innerHTML = `<span>${esc(txt)}${sp && ms > 0 ? ' · ' + esc(sp.title) : ''}</span>${sp && ms > 0 ? `<button type="button" data-go="${I.id}:${sp.i}">Y aller</button>` : ''}<button type="button" aria-label="Fermer" data-x="${I.id}">✕</button>`;
    pill.classList.add('on');
  } else pill.classList.remove('on');
}
document.body.insertAdjacentHTML('beforeend', '<div id="goldenPill" role="status"></div>');
document.addEventListener('click', e => {
  const go = e.target.closest('[data-go]'), x = e.target.closest('[data-x]');
  if (go) { const [d, i] = go.dataset.go.split(':'); focusStepOnMap(d, +i); }
  if (x) { sessionStorage.setItem('rs_gp_' + x.dataset.x, '1'); $('#goldenPill').classList.remove('on'); }
});
const _rd = window.renderDays;
window.renderDays = function () { const r = _rd.apply(this, arguments);
  const list = currentDayFilter === 'all' ? itineraryData : itineraryData.filter(d => d.id === currentDayFilter);
  $$('#daysContainer .day-card').forEach((card, i) => { const day = list[i]; if (!day) return;
    const html = goldenHtml(itineraryData.indexOf(day)); if (!html) return;
    const anchor = $('.weather-strip', card) || $('.day-card-header', card); anchor.insertAdjacentHTML('afterend', html); });
  liveGolden(); decorate(); return r; };
setInterval(liveGolden, 30000);
/* heures de coucher du soleil du programme alignées sur le calcul (valeurs fixes d'origine un peu approximatives) */
itineraryData.forEach((d, i) => { const I = sunInfo(i); if (I.s && /Coucher du soleil/.test(d.weather)) d.weather = d.weather.replace(/(Coucher du soleil[^:]*:\s*)~?\d{1,2}h\d{2}/, `$1${hm(I.s, I.p.tz)}`); });

/* ================= C. glisser pour changer de jour ================= */
document.body.insertAdjacentHTML('beforeend', '<div id="dayMark" aria-hidden="true"><b></b><i></i></div>');
const neighbor = dir => { const i = itineraryData.findIndex(d => d.id === currentDayFilter); return i < 0 ? null : itineraryData[i + dir] || null; };
function centerPill() { const p = $('#daySelector .day-pill.active'); if (p && p.parentElement) p.parentElement.scrollTo({ left: p.offsetLeft - p.parentElement.clientWidth / 2 + p.clientWidth / 2, behavior: 'smooth' }); }
async function goDay(dir, viaSwipe) {
  const nx = neighbor(dir), cont = $('#daysContainer'); if (!nx) return false;
  const rm = calm();
  if (!rm) { cont.style.transition = 'transform .16s ease-in, opacity .16s'; cont.style.transform = `translate3d(${dir > 0 ? -70 : 70}px,0,0)`; cont.style.opacity = '0'; await sleep(160); }
  window.filterDay(nx.id);
  if (!rm) { cont.style.transition = 'none'; cont.style.transform = `translate3d(${dir > 0 ? 70 : -70}px,0,0)`; void cont.offsetWidth; cont.style.transition = 'transform .45s var(--smooth), opacity .35s'; cont.style.transform = ''; cont.style.opacity = '1'; }
  const i = itineraryData.indexOf(nx), mk = $('#dayMark'); $('b', mk).textContent = `${i + 1}/${itineraryData.length}`; $('i', mk).textContent = `${nx.shortLabel} · ${nx.subLabel}`;
  if (!rm) { mk.classList.remove('go'); void mk.offsetWidth; mk.classList.add('go'); }
  announce(`Jour ${i + 1} sur ${itineraryData.length} : ${nx.title}`);
  const sel = $('#daySelector'); if (sel) { const top = sel.getBoundingClientRect().top + scrollY - 10; if (scrollY > top) scrollTo({ top, behavior: rm ? 'auto' : 'smooth' }); }
  centerPill(); vibrate(8); return true;
}
(() => {
  const tab = $('#tab-itineraire'), cont = $('#daysContainer'); let sx = 0, sy = 0, st = 0, lock = null, dx = 0, on = false;
  tab.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || currentDayFilter === 'all' || e.target.closest('.day-selector, input, textarea, select, button.btn-del')) return;
    const t = e.touches[0]; if (t.clientX < 22 || t.clientX > innerWidth - 22) return;   // laisse les gestes « retour » du système
    sx = t.clientX; sy = t.clientY; st = performance.now(); lock = null; dx = 0; on = true; cont.style.transition = 'none';
  }, { passive: true });
  tab.addEventListener('touchmove', e => {
    if (!on) return; const t = e.touches[0], mx = t.clientX - sx, my = t.clientY - sy;
    if (lock === null) { if (Math.abs(mx) > 10 && Math.abs(mx) > Math.abs(my) * 1.5) lock = 'h'; else if (Math.abs(my) > 10) { lock = 'v'; on = false; return; } else return; }
    dx = mx; const edge = !neighbor(mx < 0 ? 1 : -1), k = edge ? 0.18 : 0.5;
    cont.style.transform = `translate3d(${(mx * k).toFixed(1)}px,0,0)`; cont.style.opacity = String(1 - Math.min(0.5, Math.abs(mx) * k / 260));
  }, { passive: true });
  const end = () => {
    if (!on) return; on = false; if (lock !== 'h') return;
    const v = dx / Math.max(1, performance.now() - st), dir = dx < 0 ? 1 : -1;
    if ((Math.abs(dx) > 70 || (Math.abs(dx) > 30 && Math.abs(v) > 0.45)) && neighbor(dir)) { cont.style.opacity = '1'; goDay(dir, true); }
    else { cont.style.transition = 'transform .4s var(--spring), opacity .3s'; cont.style.transform = ''; cont.style.opacity = '1'; }
  };
  tab.addEventListener('touchend', end, { passive: true }); tab.addEventListener('touchcancel', end, { passive: true });
  document.addEventListener('keydown', e => {
    if (e.target.closest && e.target.closest('input, textarea, select')) return;
    const act = $('.tab-section.active'); if (!act || act.id !== 'tab-itineraire' || $('#sheet.on') || $('#intro')) return;
    if (e.key === 'ArrowRight') goDay(1); else if (e.key === 'ArrowLeft') goDay(-1);
  });
})();
const _fd = window.filterDay; window.filterDay = function () { const r = _fd.apply(this, arguments); decorate(); return r; };

/* ================= E. accessibilité + confort mobile ================= */
function decorate() {
  $$('.step-item').forEach(row => { const c = $('input.step-checkbox', row), t = $('.step-title', row); if (c && t && !c.getAttribute('aria-label')) c.setAttribute('aria-label', 'Fait : ' + t.textContent.trim()); });
  $$('.day-pill').forEach(b => b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false'));
  $$('.nav-btn').forEach(b => { if (!b.getAttribute('aria-label')) b.setAttribute('aria-label', b.textContent.trim().replace(/\s+/g, ' ')); b.setAttribute('aria-current', b.classList.contains('active') ? 'page' : 'false'); });
}
/* zone tactile élargie : toucher le bord gauche d'une étape coche la case (cible ≥ 48 px) */
document.addEventListener('click', e => {
  const row = e.target.closest('.step-item'); if (!row || e.target.closest('a, button, input')) return;
  const r = row.getBoundingClientRect(); if (e.clientX - r.left < 52) { const c = $('input.step-checkbox', row); if (c) c.click(); }
});
const _sd = window.renderDaySelector; window.renderDaySelector = function () { const r = _sd.apply(this, arguments); decorate(); return r; };
const _st = window.switchTab; window.switchTab = function () { const r = _st.apply(this, arguments); decorate(); return r; };
const dcn = $('#daysContainer'); if (dcn) new MutationObserver(decorate).observe(dcn, { childList: true });
$('meta[name="viewport"]') && $('meta[name="viewport"]').setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');

/* taille du texte */
const applyFs = () => { const f = store.get('rs_fs', '100'); document.documentElement.style.fontSize = f + '%'; };
applyFs();
/* écran allumé */
let wake = null;
async function wakeOn() { try { if ('wakeLock' in navigator && store.get('rs_wake') === '1' && document.visibilityState === 'visible') wake = await navigator.wakeLock.request('screen'); } catch (e) {} }
document.addEventListener('visibilitychange', wakeOn); wakeOn();

/* fiche de réglages */
document.body.insertAdjacentHTML('beforeend', '<div id="sheetBack"></div><div id="sheet" role="dialog" aria-modal="true" aria-labelledby="shTitle"></div>');
function sheetHtml() {
  const w = who(), f = store.get('rs_fs', '100'), sp = (k, v, l) => `<button type="button" data-set="${k}:${v}" aria-pressed="${(k === 'who' ? w : f) === v}">${l}</button>`;
  const tg = (k, l) => `<button type="button" class="row-btn" data-tog="${k}" aria-pressed="${store.get(k) === '1'}"><span>${l}</span><span class="sw"></span></button>`;
  return `<div class="grab"></div><h2 id="shTitle">Réglages</h2>
  <h3>Qui es-tu ?</h3><div class="seg">${sp('who', 'Hugo', 'Hugo')}${sp('who', 'Camille', 'Camille')}</div>
  <h3>Synchro entre vos téléphones</h3><div id="shSync" class="note"></div>
  <label class="note" for="roomIn" style="display:block;margin-top:8px">Code de synchro (identique sur vos deux téléphones)</label><input id="roomIn" type="text" value="${esc(room())}" autocapitalize="off" autocomplete="off" spellcheck="false">
  <button type="button" class="row-btn" data-act="resync"><span>🔄 Resynchroniser maintenant</span></button>
  <h3>Confort de lecture</h3><div class="seg">${sp('fs', '100', 'Texte A')}${sp('fs', '112', 'Texte A+')}${sp('fs', '125', 'Texte A++')}</div>
  ${tg('rs_calm', '🧘 Réduire les animations')}${tg('rs_wake', '🔆 Garder l’écran allumé')}
  <button type="button" class="row-btn" data-act="intro"><span>🎬 Revoir l’intro</span></button>
  <button type="button" class="close" data-act="close">Fermer</button>`;
}
let lastFocus = null;
function openSheet() { lastFocus = document.activeElement; const sh = $('#sheet'); sh.innerHTML = sheetHtml(); $('#shSync', sh).textContent = $('#syncTxt').textContent; $('#sheetBack').classList.add('on'); sh.classList.add('on'); setTimeout(() => $('.seg button', sh).focus(), 350); }
function closeSheet() { $('#sheet').classList.remove('on'); $('#sheetBack').classList.remove('on'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
$('#sheetBack').addEventListener('click', closeSheet);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#sheet.on')) closeSheet(); else if ($('#intro')) endIntro(); } });
$('#sheet').addEventListener('click', e => {
  const s = e.target.closest('[data-set]'), t = e.target.closest('[data-tog]'), a = e.target.closest('[data-act]');
  if (s) { const [k, v] = s.dataset.set.split(':'); if (k === 'who') store.set('rs_who', v); else { store.set('rs_fs', v); applyFs(); } $('#sheet').innerHTML = sheetHtml(); $('#shSync').textContent = $('#syncTxt').textContent; paintSync(); }
  if (t) { const k = t.dataset.tog, on = store.get(k) !== '1'; store.set(k, on ? '1' : '0'); t.setAttribute('aria-pressed', on); if (k === 'rs_wake') { if (on) wakeOn(); else { try { wake && wake.release(); } catch (e) {} } } else toast('Redémarrage pour appliquer…', 1200), setTimeout(() => location.reload(), 900); }
  if (a) { const k = a.dataset.act;
    if (k === 'close') closeSheet();
    if (k === 'resync') { const v = ($('#roomIn').value || '').trim(); if (v && v !== room()) { store.set('rs_room', v); sseOk = false; openLive(); } poll(); schedulePublish(300); toast('🔄 Synchronisation lancée'); }
    if (k === 'intro') { closeSheet(); setTimeout(() => showIntro(true), 350); } }
});
$('#sheet').addEventListener('keydown', e => {   // le focus reste dans la fiche
  if (e.key !== 'Tab') return; const f = $$('button, input', $('#sheet')); if (!f.length) return; const a = f[0], z = f[f.length - 1];
  if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
});

/* ================= D. mini intro ================= */
let introDone = null;
function endIntro() { const ov = $('#intro'); if (!ov) return; store.set('rs_intro_v2', '1'); ov.classList.add('out'); document.documentElement.style.overflow = ''; setTimeout(() => { ov.remove(); const h = $('.hero-header h1'); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }, 750); paintSync(); }
function showIntro(force) {
  if ($('#intro') || (!force && store.get('rs_intro_v2'))) return;
  const R = { x: 236, y: 396 }, S = { x: 128, y: 176 }, rm = calm();
  let stars = ''; for (let i = 0; i < 70; i++) stars += `<circle class="st${i % 6 === 0 ? ' tw' : ''}" cx="${(Math.random() * 360).toFixed(0)}" cy="${(Math.random() * 600).toFixed(0)}" r="${(Math.random() * 1.3 + 0.4).toFixed(1)}" style="animation-delay:${(Math.random() * 3).toFixed(1)}s"/>`;
  const ov = document.createElement('div'); ov.id = 'intro'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true'); ov.setAttribute('aria-label', 'Bienvenue dans le carnet de voyage');
  ov.innerHTML = `<button type="button" class="in-skip">Passer</button>
  <svg viewBox="0 0 360 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="inG" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#F4B961"/><stop offset="1" stop-color="#E07A5F"/></linearGradient></defs>
    <g>${stars}</g>
    <path id="inArc" d="M${R.x} ${R.y} C ${R.x + 20} 250, 190 190, ${S.x} ${S.y}" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round"/>
    <path id="inArcOn" d="M${R.x} ${R.y} C ${R.x + 20} 250, 190 190, ${S.x} ${S.y}" fill="none" stroke="url(#inG)" stroke-width="3" stroke-linecap="round"/>
    <g class="city" id="cR"><circle class="ring" cx="${R.x}" cy="${R.y}" r="12"/><circle cx="${R.x}" cy="${R.y}" r="6" fill="#F4B961"/><text class="lbl" x="${R.x + 14}" y="${R.y + 5}">Riga</text></g>
    <g class="city" id="cS"><circle class="ring" cx="${S.x}" cy="${S.y}" r="12"/><circle cx="${S.x}" cy="${S.y}" r="6" fill="#F4B961"/><text class="lbl" x="${S.x + 14}" y="${S.y + 5}">Stockholm</text></g>
    <text id="inPlane" font-size="26" text-anchor="middle" dominant-baseline="central" style="opacity:0">✈️</text></svg>
  <div class="box"><h1 class="serif" id="inH">Riga &amp; Stockholm</h1><p class="sub" id="inSub">9 jours en amoureux · 24 oct → 1 nov</p>
    <div class="who" id="inWho"><p>Qui ouvre le carnet ?</p><div class="seg"><button type="button" data-w="Hugo">Hugo</button><button type="button" class="go" data-w="Camille">Camille</button></div></div></div>`;
  document.body.appendChild(ov); document.documentElement.style.overflow = 'hidden';
  const arc = $('#inArcOn', ov), plane = $('#inPlane', ov), L = arc.getTotalLength(), show = id => $(id, ov).classList.add('on');
  arc.style.strokeDasharray = L; arc.style.strokeDashoffset = rm ? 0 : L;
  const place = t => { const p = arc.getPointAtLength(L * t), q = arc.getPointAtLength(Math.min(L, L * t + 2)), a = Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI; plane.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${a + 45})`); plane.style.opacity = t > 0 && t < 1 ? 1 : 0; arc.style.strokeDashoffset = L * (1 - t); };
  const finish = () => { ['#cR', '#cS', '#inH', '#inSub', '#inWho'].forEach(show); plane.style.opacity = 0; arc.style.strokeDashoffset = 0; setTimeout(() => $('#inWho button', ov).focus({ preventScroll: true }), 50); };
  let stop = false; introDone = () => { stop = true; };
  (async () => {
    if (rm) { finish(); return; }
    await sleep(350); if (stop) return; show('#cR'); await sleep(650); if (stop) return;
    const t0 = performance.now(), D = 2100;
    await new Promise(res => { const f = n => { if (stop) return res(); const u = Math.min(1, (n - t0) / D), e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; place(e); u < 1 ? requestAnimationFrame(f) : res(); }; requestAnimationFrame(f); });
    if (stop) return; show('#cS'); plane.style.opacity = 0; await sleep(350); if (stop) return; show('#inH'); show('#inSub'); await sleep(650); if (stop) return; show('#inWho'); setTimeout(() => $('#inWho button', ov).focus({ preventScroll: true }), 400);
  })();
  $('.in-skip', ov).addEventListener('click', () => { if (introDone) introDone(); endIntro(); });
  $('#inWho', ov).addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (!b) return; store.set('rs_who', b.dataset.w); if (introDone) introDone(); endIntro(); setTimeout(() => toast(`Bienvenue ${b.dataset.w} ❤️`), 900); });
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('svg')) { if (!$('#inWho', ov).classList.contains('on')) { if (introDone) introDone(); finish(); } } });
}

/* ================= démarrage ================= */
window.filterDay(currentDayFilter); try { updateGlobalProgress(); } catch (e) {} decorate(); paintSync(); startSync(); showIntro(false);
})();
