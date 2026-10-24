/* scrollfx.js — Carnet Riga & Stockholm : effets au défilement façon Apple
   1. Programme = « tambour 3D » : les étapes pivotent en défilant, celle du centre se met en avant
   2. Fil conducteur qui se dessine le long des étapes pendant le scroll
   3. Révélations en perspective des cartes (une seule fois, à l'arrivée à l'écran)
   4. En-tête qui s'éloigne en douceur + barre compacte vitrée + barre de progression de lecture
   Désactivé automatiquement si l'appareil demande « réduire les animations ». */
(() => {
  if ((window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) || localStorage.getItem('rs_calm') === '1') return;
  const root = document.documentElement;
  root.classList.add('fx');

  /* ---------- styles ---------- */
  const css = document.createElement('style');
  css.textContent = `
  .fx .info-card { animation: none; }
  .fx .hero-header { transform-origin: 50% 0; will-change: transform, opacity; }

  /* révélation en perspective */
  .fx .fx-r { opacity: 0; transform: perspective(900px) translateY(38px) rotateX(9deg) scale(.96); transform-origin: 50% 50%;
    transition: opacity .7s var(--smooth), transform .95s var(--smooth); transition-delay: var(--fx-d, 0ms); }
  .fx .fx-r.fx-in { opacity: 1; transform: none; }

  /* tambour 3D des étapes */
  .fx .steps-list { position: relative; }
  .fx .step-item { position: relative; z-index: 1; transform-origin: 50% 50%; backface-visibility: hidden;
    transition: background-color .35s ease, box-shadow .35s ease; }
  .fx .step-item.done { background: transparent; }
  .fx .step-item.fx-focus { background: linear-gradient(100deg, #FFF8F3 0%, rgba(255,248,243,0) 100%);
    box-shadow: 0 14px 28px -18px rgba(200, 90, 50, .55); }
  .fx .step-item.fx-focus .step-checkbox { transform: scale(1.12); box-shadow: 0 0 0 5px rgba(200, 90, 50, .14); }
  .fx .step-item.fx-focus .step-checkbox:checked { box-shadow: 0 0 0 5px rgba(45, 90, 76, .16); }

  /* fil conducteur qui se dessine */
  .fx .steps-list::before { content: ""; position: absolute; left: 17.5px; top: 26px; bottom: 22px; width: 3px; border-radius: 3px; z-index: 0;
    background: linear-gradient(to bottom, var(--accent-terra) 0, var(--accent-forest) calc(var(--p, 0) * 100%), #EADFD3 calc(var(--p, 0) * 100%)); }

  /* barre de progression de lecture */
  #fxProg { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 1200; transform-origin: 0 50%; transform: scaleX(0);
    background: linear-gradient(90deg, var(--accent-terra), var(--accent-gold)); pointer-events: none; }

  /* barre compacte vitrée */
  #fxBar { position: fixed; top: 0; left: 50%; width: min(100%, 540px); z-index: 1100; transform: translate(-50%, -110%); opacity: 0;
    padding: calc(env(safe-area-inset-top, 0px) + 9px) 16px 9px; display: flex; justify-content: space-between; align-items: center; gap: 10px;
    background: rgba(250, 245, 238, .72); -webkit-backdrop-filter: saturate(180%) blur(18px); backdrop-filter: saturate(180%) blur(18px);
    border-bottom: 1px solid rgba(230, 219, 208, .8); font-size: .78rem; font-weight: 700; color: var(--accent-forest);
    transition: transform .45s var(--smooth), opacity .35s ease; pointer-events: none; }
  #fxBar.on { transform: translate(-50%, 0); opacity: 1; }
  #fxBar span:last-child { color: var(--accent-terra-dark); font-weight: 600; font-size: .72rem; }
  `;
  document.head.appendChild(css);

  /* ---------- barres fixes ---------- */
  document.body.insertAdjacentHTML('beforeend', '<div id="fxProg"></div><div id="fxBar"><span>📓 Riga &amp; Stockholm</span><span id="fxBarTxt"></span></div>');
  const prog = document.getElementById('fxProg'), bar = document.getElementById('fxBar'), barTxt = document.getElementById('fxBarTxt');
  const hero = document.querySelector('.hero-header');

  /* ---------- révélations ---------- */
  const SEL = '.info-card, .food-item, .ticket-card, .metric-box, .converter-box, .budget-summary-grid';
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('fx-in'); io.unobserve(e.target);
      setTimeout(() => { e.target.classList.remove('fx-r', 'fx-in'); e.target.style.removeProperty('--fx-d'); }, 1300); // libère la carte après l'animation
    }), { rootMargin: '0px 0px -6% 0px', threshold: 0 });
  }
  const scan = (scope = document) => {
    if (!io) return;
    scope.querySelectorAll(SEL).forEach(el => {
      if (el.dataset.fx) return; el.dataset.fx = '1';
      const sib = el.parentElement ? [...el.parentElement.children].filter(c => c.matches(SEL)) : [el];
      el.style.setProperty('--fx-d', Math.min(sib.indexOf(el), 5) * 70 + 'ms');
      el.classList.add('fx-r'); io.observe(el);
    });
  };
  scan();
  const dc = document.getElementById('daysContainer');
  if (dc) new MutationObserver(() => { scan(dc); schedule(); }).observe(dc, { childList: true });

  /* ---------- boucle de défilement ---------- */
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let ticking = false, lastFocus = null;
  const schedule = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };

  function frame() {
    ticking = false;
    const y = window.scrollY || 0, vh = window.innerHeight, docH = document.documentElement.scrollHeight - vh;

    // progression de lecture + barre compacte
    prog.style.transform = `scaleX(${docH > 0 ? clamp(y / docH, 0, 1) : 0})`;
    const compact = y > 230;
    if (bar.classList.contains('on') !== compact) bar.classList.toggle('on', compact);
    if (compact) { const t = document.getElementById('progressText'); const s = t ? t.textContent : ''; if (barTxt.textContent !== s) barTxt.textContent = s; }

    root.classList.toggle('hero-off', y > 420);
    // en-tête : s'éloigne doucement
    if (hero) {
      const k = clamp(y / 320, 0, 1);
      hero.style.transform = y > 0 ? `translate3d(0, ${(y * 0.2).toFixed(1)}px, 0) scale(${(1 - 0.06 * k).toFixed(3)})` : '';
      hero.style.opacity = y > 0 ? (1 - 0.85 * k).toFixed(3) : '';
    }

    // tambour 3D : uniquement dans le programme
    const tab = document.querySelector('.tab-section.active');
    if (!tab || tab.id !== 'tab-itineraire') return;
    const focusY = vh * 0.46, span = vh * 0.55;
    const cards = [...tab.querySelectorAll('.day-card')].filter(c => { const r = c.getBoundingClientRect(); return r.bottom > -vh * 0.5 && r.top < vh * 1.5; });
    const items = cards.flatMap(c => [...c.querySelectorAll('.step-item')]), rects = items.map(el => el.getBoundingClientRect());
    let best = null, bestD = 1e9;
    items.forEach((el, i) => {
      const r = rects[i];
      if (r.bottom < -vh * 0.4 || r.top > vh * 1.4) return;
      const c = r.top + r.height / 2, n = clamp((c - focusY) / span, -1.5, 1.5), a = Math.abs(n);
      if (a < bestD) { bestD = a; best = el; }
      if (a < 0.07) { el.style.transform = ''; el.style.opacity = ''; return; }
      const rot = (-n * 24).toFixed(1), z = (-Math.min(a, 1.2) * 60).toFixed(0), sc = (1 - 0.06 * Math.min(a, 1.2)).toFixed(3);
      el.style.transform = `perspective(900px) translateZ(${z}px) rotateX(${rot}deg) scale(${sc})`;
      el.style.opacity = (1 - 0.6 * clamp((a - 0.45) / 0.9, 0, 1)).toFixed(2);
    });
    const f = bestD < 0.3 ? best : null;
    if (f !== lastFocus) { if (lastFocus) lastFocus.classList.remove('fx-focus'); if (f) f.classList.add('fx-focus'); lastFocus = f; }

    // fil conducteur
    tab.querySelectorAll('.steps-list').forEach(list => {
      const r = list.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      list.style.setProperty('--p', clamp((focusY - r.top - 26) / Math.max(1, r.height - 48), 0, 1).toFixed(3));
    });
  }

  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  const _sw = window.switchTab;
  if (typeof _sw === 'function') window.switchTab = function () { const r = _sw.apply(this, arguments); lastFocus = null; schedule(); setTimeout(schedule, 450); return r; };
  const _fd = window.filterDay;
  if (typeof _fd === 'function') window.filterDay = function () { const r = _fd.apply(this, arguments); schedule(); return r; };
  schedule();
})();
