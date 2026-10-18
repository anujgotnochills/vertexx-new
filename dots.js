/* Dot-matrix glyphs (5×7) + footer canvas wordmark */
(function () {
  const G = {
    '0':['01110','10001','10011','10101','11001','10001','01110'],
    '1':['00100','01100','00100','00100','00100','00100','01110'],
    '2':['01110','10001','00001','00010','00100','01000','11111'],
    '3':['11111','00010','00100','00010','00001','10001','01110'],
    '4':['00010','00110','01010','10010','11111','00010','00010'],
    '5':['11111','10000','11110','00001','00001','10001','01110'],
    '6':['00110','01000','10000','11110','10001','10001','01110'],
    '7':['11111','00001','00010','00100','01000','01000','01000'],
    '8':['01110','10001','10001','01110','10001','10001','01110'],
    '9':['01110','10001','10001','01111','00001','00010','01100'],
    a:['00000','00000','01110','00001','01111','10001','01111'],
    b:['10000','10000','10110','11001','10001','10001','11110'],
    c:['00000','00000','01110','10000','10000','10001','01110'],
    d:['00001','00001','01101','10011','10001','10001','01111'],
    e:['00000','00000','01110','10001','11111','10000','01110'],
    f:['00110','01001','01000','11100','01000','01000','01000'],
    g:['00000','01111','10001','10001','01111','00001','01110'],
    h:['10000','10000','10110','11001','10001','10001','10001'],
    i:['00100','00000','01100','00100','00100','00100','01110'],
    j:['00010','00000','00110','00010','00010','10010','01100'],
    k:['10000','10000','10010','10100','11000','10100','10010'],
    l:['01100','00100','00100','00100','00100','00100','01110'],
    m:['00000','00000','11010','10101','10101','10001','10001'],
    n:['00000','00000','10110','11001','10001','10001','10001'],
    o:['00000','00000','01110','10001','10001','10001','01110'],
    p:['00000','11110','10001','10001','11110','10000','10000'],
    q:['00000','01111','10001','10001','01111','00001','00001'],
    r:['00000','00000','10110','11001','10000','10000','10000'],
    s:['00000','00000','01111','10000','01110','00001','11110'],
    t:['01000','01000','11100','01000','01000','01001','00110'],
    u:['00000','00000','10001','10001','10001','10011','01101'],
    v:['00000','00000','10001','10001','10001','01010','00100'],
    w:['00000','00000','10001','10001','10101','10101','01010'],
    x:['00000','00000','10001','01010','00100','01010','10001'],
    y:['00000','10001','10001','10001','01111','00001','01110'],
    z:['00000','00000','11111','00010','00100','01000','11111'],
    '.':['00000','00000','00000','00000','00000','01100','01100'],
    ' ':['00000','00000','00000','00000','00000','00000','00000']
  };
  const ARROW = ['0001000','0000100','0000010','1111111','0000010','0000100','0001000'];
  const NS = 'http://www.w3.org/2000/svg';

  function digitSVG() {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 50 70');
    svg.setAttribute('aria-hidden', 'true');
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
      const ci = document.createElementNS(NS, 'circle');
      ci.setAttribute('cx', c * 10 + 5); ci.setAttribute('cy', r * 10 + 5); ci.setAttribute('r', 3.4);
      ci.classList.add('off'); svg.appendChild(ci);
    }
    return svg;
  }
  function setDigit(svg, ch) {
    const map = ch == null ? null : G[ch];
    const cs = svg.querySelectorAll('circle');
    for (let i = 0; i < 35; i++) {
      const on = map && map[Math.floor(i / 5)][i % 5] === '1';
      cs[i].classList.toggle('off', !on);
    }
  }
  function arrowSVG() {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 70 70'); svg.classList.add('pl-arrow'); svg.setAttribute('aria-hidden', 'true');
    ARROW.forEach((row, r) => [...row].forEach((b, c) => {
      if (b !== '1') return;
      const ci = document.createElementNS(NS, 'circle');
      ci.setAttribute('cx', c * 10 + 5); ci.setAttribute('cy', r * 10 + 5); ci.setAttribute('r', 3.4);
      svg.appendChild(ci);
    }));
    return svg;
  }

  /* ---------------- Footer canvas ---------------- */
  function footerDots(canvas, text) {
    const ctx = canvas.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W, H, dpr, pitch, dots = [], running = false, raf;
    const mouse = { x: -9999, y: -9999 };
    const chars = [...text.toLowerCase()].map(ch => G[ch] || G[' ']);
    const cols = chars.length * 6 - 1;

    function layout() {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pad = W < 768 ? 20 : 39;
      pitch = Math.min((W - pad * 2) / cols, (H * 0.86) / 7);
      const ox = (W - cols * pitch) / 2 + pitch / 2;
      const oy = (H - 7 * pitch) / 2 + pitch / 2;
      dots = [];
      chars.forEach((g, ci) => {
        for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) {
          const on = g[r][c] === '1';
          const hx = ox + (ci * 6 + c) * pitch, hy = oy + r * pitch;
          dots.push({ hx, hy, x: hx, y: hy, vx: 0, vy: 0, on, ph: Math.random() * Math.PI * 2, sp: .6 + Math.random() * .9 });
        }
      });
      draw(0);
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      const rad = pitch * 0.34, R = Math.max(80, pitch * 2.2);
      for (const d of dots) {
        if (!reduce) {
          const dx = d.x - mouse.x, dy = d.y - mouse.y, dist = Math.hypot(dx, dy);
          if (dist < R && dist > 0.01) {
            const f = (1 - dist / R) * 2.4;
            d.vx += (dx / dist) * f; d.vy += (dy / dist) * f;
          }
          d.vx += (d.hx - d.x) * 0.08; d.vy += (d.hy - d.y) * 0.08;
          d.vx *= 0.78; d.vy *= 0.78;
          d.x += d.vx; d.y += d.vy;
        }
        let a;
        if (d.on) a = reduce ? 1 : 0.78 + 0.22 * Math.sin(t * 0.0012 * d.sp + d.ph);
        else a = 0.07 + (reduce ? 0 : 0.04 * Math.sin(t * 0.0009 * d.sp + d.ph));
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath(); ctx.arc(d.x, d.y, rad, 0, Math.PI * 2); ctx.fill();
      }
    }
    function loop(t) { draw(t); if (running) raf = requestAnimationFrame(loop); }
    function start() { if (running) return; running = true; raf = requestAnimationFrame(loop); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    canvas.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    new ResizeObserver(layout).observe(canvas);
    new IntersectionObserver(([en]) => en.isIntersecting ? start() : stop()).observe(canvas);
    layout();
  }

  window.Dots = { digitSVG, setDigit, arrowSVG, footerDots };
})();
