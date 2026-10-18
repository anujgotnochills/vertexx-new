(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const CFG = window.STUDIO;

  /* ---------------- PRELOADER ---------------- */
  function preloader(onDone) {
    const html = document.documentElement;
    const el = $('#preloader');
    const seen = sessionStorage.getItem('pl-seen');
    if (!el || seen) { html.removeAttribute('data-startup'); el && el.remove(); onDone(); return; }
    const counter = $('.pl-counter', el);
    const digits = [0, 1, 2].map(() => { const s = Dots.digitSVG(); counter.appendChild(s); return s; });
    $('.pl-tl', el).appendChild(Dots.arrowSVG());
    const t0 = performance.now(), dur = reduce ? 400 : 2200;
    function render(v) {
      const s = String(v);
      const padded = s.padStart(3, ' ');
      digits.forEach((d, i) => { Dots.setDigit(d, padded[i] === ' ' ? null : padded[i]); d.style.display = (v < 100 && i === 0) ? 'none' : ''; });
      counter.setAttribute('aria-valuenow', v);
    }
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      render(Math.round(e * 100));
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(() => {
        el.style.animation = 'none';
        el.classList.add('out');
        sessionStorage.setItem('pl-seen', '1');
        html.removeAttribute('data-startup');
        onDone();
        setTimeout(() => el.remove(), 1200);
      }, 250);
    })(t0);
  }

  /* ---------------- LENIS ---------------- */
  let lenis = null;
  function smooth() {
    if (reduce || !window.Lenis) return;
    lenis = new Lenis({ lerp: 0.1 });
    (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(performance.now());
  }

  /* ---------------- HEADER ---------------- */
  function header() {
    const h = $('.site-header');
    let last = scrollY;
    addEventListener('scroll', () => {
      const y = scrollY;
      if (Math.abs(y - last) < 6) return;
      h.classList.toggle('hidden', y > last && y > 120 && !document.body.classList.contains('menu-open'));
      last = y;
    }, { passive: true });

    const mm = $('#mobile-menu');
    const open = () => { mm.classList.add('open'); document.body.classList.add('menu-open'); lenis && lenis.stop();
      $$('.reveal', mm).forEach((r, i) => { r.classList.remove('in'); r.style.setProperty('--d', (0.1 + i * 0.06) + 's'); requestAnimationFrame(() => requestAnimationFrame(() => r.classList.add('in'))); }); };
    const close = () => { mm.classList.remove('open'); document.body.classList.remove('menu-open'); lenis && lenis.start(); };
    $('#menu-open').addEventListener('click', open);
    $('#menu-close').addEventListener('click', close);
    $$('a', mm).forEach(a => a.addEventListener('click', close));
  }

  /* ---------------- ANCHORS (smooth + view transition) ---------------- */
  function anchors() {
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      if (id.length < 2) { e.preventDefault(); return; }
      const t = $(id); if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: 0, duration: 1.4 });
      else scrollTo({ top: t.getBoundingClientRect().top + scrollY, behavior: reduce ? 'auto' : 'smooth' });
    }));
  }

  /* ---------------- REVEAL ---------------- */
  function reveal() {
    $$('[data-stagger]').forEach(g => [...g.children].forEach((c, i) => {
      const t = c.classList.contains('reveal') ? c : c.querySelector('.reveal') || c;
      t.classList.add('reveal'); t.style.setProperty('--d', (i * 0.08) + 's');
    }));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -10% 0px' });
    $$('.reveal').forEach(el => { if (!el.closest('#mobile-menu')) io.observe(el); });
  }

  /* ---------------- CAROUSEL ---------------- */
  function carousel() {
    const root = $('#carousel'); if (!root) return;
    const track = $('.car-track', root);
    const originals = $$('.car-card', track);
    const n = originals.length;
    const before = originals.map(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); return k; });
    const after = originals.map(c => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); return k; });
    before.forEach(k => track.insertBefore(k, originals[0]));
    after.forEach(k => track.appendChild(k));
    let idx = n, drag = 0, dragging = false, startX = 0, startY = 0, moved = false, lock = null;
    const step = () => { const c = track.children[0]; return c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0); };
    const apply = (anim) => {
      track.classList.toggle('anim', !!anim && !reduce);
      track.style.transform = `translateX(calc(var(--page-margin) - ${idx} * (var(--card-width) + var(--card-gap)) + ${drag}px))`;
    };
    const go = (d) => { idx += d; drag = 0; apply(true); if (reduce) normalize(); };
    function normalize() {
      if (idx < n || idx >= 2 * n) { idx = ((idx - n) % n + n) % n + n; apply(false); void track.offsetWidth; }
    }
    track.addEventListener('transitionend', e => { if (e.target === track) normalize(); });
    $('.car-prev', root).addEventListener('click', () => go(-1));
    $('.car-next', root).addEventListener('click', () => go(1));

    track.addEventListener('pointerdown', e => {
      dragging = true; moved = false; lock = null; startX = e.clientX; startY = e.clientY;
      track.classList.add('dragging'); track.classList.remove('anim');
    });
    addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!lock) { if (Math.abs(dx) > 6 || Math.abs(dy) > 6) lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'; else return; }
      if (lock !== 'x') return;
      moved = true; drag = dx; apply(false);
    });
    const end = () => {
      if (!dragging) return; dragging = false; track.classList.remove('dragging');
      const s = step(); const d = drag / s;
      const k = Math.abs(d) < 0.15 ? 0 : (d > 0 ? -Math.max(1, Math.round(d)) : Math.max(1, Math.round(-d)));
      go(k);
    };
    addEventListener('pointerup', end); addEventListener('pointercancel', end);
    track.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);
    track.addEventListener('dragstart', e => e.preventDefault());

    let hover = false;
    root.addEventListener('mouseenter', () => hover = true);
    root.addEventListener('mouseleave', () => hover = false);
    if (!reduce) setInterval(() => { if (!hover && !dragging && document.visibilityState === 'visible') go(1); }, 4000);
    addEventListener('resize', () => apply(false));
    apply(false);
  }

  /* ---------------- 3D SWATCHES ---------------- */
  function swatches() {
    $$('.swatch').forEach(b => b.addEventListener('click', () => {
      $$('.swatch').forEach(x => x.setAttribute('aria-pressed', x === b));
      $$('.render-card .ph').forEach(p => p.classList.toggle('on', p.dataset.c === b.dataset.c));
    }));
  }

  /* ---------------- VIDEO PILL ---------------- */
  function videoPill() {
    const card = $('.video-card'), btn = $('.play-pill'); if (!card) return;
    const set = (paused) => {
      card.classList.toggle('paused', paused);
      btn.innerHTML = paused
        ? '<svg viewBox="0 0 14 14" fill="currentColor"><path d="M3 1.8v10.4L12 7z"/></svg>Play'
        : '<svg viewBox="0 0 14 14" fill="currentColor"><rect x="2.5" y="2" width="3" height="10" rx="1"/><rect x="8.5" y="2" width="3" height="10" rx="1"/></svg>Pause';
      btn.setAttribute('aria-label', paused ? 'Play reel' : 'Pause reel');
    };
    let paused = reduce; set(paused);
    btn.addEventListener('click', () => set(paused = !paused));
    new IntersectionObserver(([e]) => { if (!paused) card.classList.toggle('paused', !e.isIntersecting); }).observe(card);
  }

  /* ---------------- TIME ZONES ---------------- */
  function tzOffset(tz, d = new Date()) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(d).map(x => [x.type, x.value]));
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
    return Math.round((asUTC - d.getTime()) / 60000);
  }
  const fmt = m => { m = ((m % 1440) + 1440) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
  function timezones() {
    const box = $('#tzbars'); if (!box) return;
    const visTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const vis = tzOffset(visTZ);
    const studio = { tz: CFG.tz, s: 11 * 60, e: 21 * 60 };
    const sOff = tzOffset(studio.tz);
    const sU = [studio.s - sOff, studio.e - sOff];
    const rows = [
      { name: CFG.cityShort, tz: CFG.tz, studio: true },
      { name: 'London', tz: 'Europe/London' },
      { name: 'New York', tz: 'America/New_York' }
    ];
    function segs(a, b) { // UTC minutes → visitor-local segments on 0..1440
      const la = ((a + vis) % 1440 + 1440) % 1440, len = b - a;
      if (la + len <= 1440) return [[la, len]];
      return [[la, 1440 - la], [0, la + len - 1440]];
    }
    function intersect(a1, a2, b1, b2) { // handles day shift
      for (const sh of [-1440, 0, 1440]) { const s = Math.max(a1, b1 + sh), e = Math.min(a2, b2 + sh); if (e > s) return [s, e]; }
      return null;
    }
    const nowLocal = (() => { const d = new Date(); return ((d.getUTCHours() * 60 + d.getUTCMinutes()) + vis + 1440) % 1440; })();
    box.innerHTML = rows.map(r => {
      const off = tzOffset(r.tz);
      const wU = r.studio ? sU : [9 * 60 - off, 18 * 60 - off];
      const ov = r.studio ? null : intersect(wU[0], wU[1], sU[0], sU[1]);
      const label = r.studio ? `${fmt(studio.s)}–${fmt(studio.e)}` : (ov ? `${fmt(ov[0] + off)}–${fmt(ov[1] + off)}` : 'async only');
      const pct = x => (x / 1440 * 100).toFixed(3) + '%';
      const work = segs(wU[0], wU[1]).map(([l, w]) => `<i class="work" style="left:${pct(l)};width:${pct(w)}"></i>`).join('');
      const ovs = (r.studio ? segs(sU[0], sU[1]) : (ov ? segs(ov[0], ov[1]) : [])).map(([l, w]) => `<i class="ov" style="left:${pct(l)};width:${pct(w)}"></i>`).join('');
      return `<div class="tzrow"><div class="lab"><span>${r.name}</span><em>${label}</em></div>
        <div class="tztrack" role="img" aria-label="${r.name} overlap ${label}">${work}${ovs}<i class="now" style="left:${pct(nowLocal)}"></i></div></div>`;
    }).join('') + `<div class="tzaxis"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>
      <div class="tzlegend"><span><i></i>Live overlap</span><span><i class="l"></i>Local 9–6</span></div>`;
    const cap = $('#tz-caption'); if (cap) cap.textContent = `Shown in your time zone (${visTZ.replace('_', ' ')}).`;
  }

  /* ---------------- PRICING ---------------- */
  function pricing() {
    const t = $('.cur-toggle'); if (!t) return;
    const thumb = $('.cur-thumb', t), btns = $$('button', t);
    const place = b => { thumb.style.width = b.offsetWidth + 'px'; thumb.style.transform = `translateX(${b.offsetLeft - 4}px)`; };
    const set = cur => {
      btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.cur === cur));
      place(btns.find(b => b.dataset.cur === cur));
      $$('.price').forEach(p => {
        const s = $('.amt strong', p), em = $('.amt em', p);
        s.style.opacity = 0;
        setTimeout(() => {
          const v = +p.dataset[cur];
          s.textContent = (cur === 'inr' ? '₹' : '$') + v.toLocaleString(cur === 'inr' ? 'en-IN' : 'en-US');
          em.textContent = cur.toUpperCase(); s.style.opacity = 1;
        }, 180);
      });
    };
    btns.forEach(b => b.addEventListener('click', () => set(b.dataset.cur)));
    addEventListener('resize', () => place(btns.find(b => b.getAttribute('aria-pressed') === 'true')));
    requestAnimationFrame(() => set('usd'));
  }

  /* ---------------- FAQ ---------------- */
  function faq() {
    $$('.faq-item').forEach(it => {
      const q = $('.faq-q', it);
      q.addEventListener('click', () => {
        const open = !it.classList.contains('open');
        it.classList.toggle('open', open);
        q.setAttribute('aria-expanded', open);
      });
    });
  }

  /* ---------------- FOOTER ---------------- */
  function footer() {
    const c = $('#dot-canvas'); if (c) Dots.footerDots(c, CFG.name);
    const toast = $('#toast');
    $('.big-mail').addEventListener('click', async e => {
      e.preventDefault();
      try { await navigator.clipboard.writeText(CFG.email); } catch (_) {
        const ta = document.createElement('textarea'); ta.value = CFG.email; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (_) {} ta.remove();
      }
      toast.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => toast.classList.remove('show'), 1800);
    });
    const blur = $('.pblur');
    new IntersectionObserver(([e]) => blur.classList.toggle('off', e.isIntersecting), { threshold: 0 }).observe($('.footer'));
  }

  /* ---------------- BOOT ---------------- */
  smooth(); header(); anchors(); carousel(); swatches(); videoPill(); timezones(); pricing(); faq(); footer();
  setInterval(timezones, 60000);
  preloader(() => reveal());
})();
