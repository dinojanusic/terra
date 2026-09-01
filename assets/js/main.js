/* ============================================================
   Terra — coming soon
   Zero dependencies. Everything degrades without JS.
   ============================================================ */
(() => {
  'use strict';

  const doc = document;
  const html = doc.documentElement;
  const body = doc.body;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const $  = (s, r = doc) => r.querySelector(s);
  const $$ = (s, r = doc) => Array.from(r.querySelectorAll(s));
  const lerp = (a, b, t) => a + (b - a) * t;

  if (finePointer && !reduced) body.classList.add('has-fine-pointer');

  /* ---------------------------------------------------------
     1. Preloader — progress until fonts + window load settle
     --------------------------------------------------------- */
  const loader = $('#loader');
  const loaderBar = $('#loaderBar');

  const bootLoader = () => {
    if (!loader) return;
    body.classList.add('is-loading');

    let shown = 0;
    let target = 8;
    let done = false;

    const finish = () => {
      if (loaderBar) loaderBar.style.width = '100%';
      loader.classList.add('is-done');
      body.classList.remove('is-loading');
      setTimeout(() => loader.remove(), 700);
      $$('.hero .reveal').forEach(el => {
        el.style.setProperty('--d', (el.dataset.delay || 0) + 'ms');
        el.classList.add('is-in');
      });
    };

    const step = () => {
      shown = lerp(shown, target, 0.12);
      if (loaderBar) loaderBar.style.width = shown.toFixed(1) + '%';
      if (!done || shown < 99.4) requestAnimationFrame(step);
      else finish();
    };

    const ready = Promise.all([
      new Promise(res => (doc.fonts && doc.fonts.ready ? doc.fonts.ready.then(res) : res())),
      new Promise(res => (doc.readyState === 'complete' ? res() : addEventListener('load', res, { once: true }))),
      new Promise(res => setTimeout(res, reduced ? 0 : 500))
    ]);

    const creep = setInterval(() => { target = Math.min(target + Math.random() * 16, 92); }, 260);
    ready.then(() => { clearInterval(creep); target = 100; done = true; });

    if (reduced) { clearInterval(creep); finish(); return; }
    requestAnimationFrame(step);
  };

  /* ---------------------------------------------------------
     2. Line-split headings, measured from real wrap points
     --------------------------------------------------------- */
  // Splits a heading on the browser's own wrap points. Measuring per character
  // with a Range gives the real line boxes; measuring inline-block words does
  // not — each carries a trailing space, so a row can be judged to fit and then
  // overflow its own line box, stranding a word on a row of its own.
  const splitLines = (el) => {
    const source = el.dataset.raw || el.textContent.trim();
    el.dataset.raw = source;
    el.textContent = source;

    const node = el.firstChild;
    const range = doc.createRange();
    const rows = [];
    let start = 0;
    let top = null;

    for (let i = 1; i <= source.length; i++) {
      range.setStart(node, i - 1);
      range.setEnd(node, i);
      const r = range.getBoundingClientRect();
      if (!r.width && !r.height) continue;        // a collapsed break space
      if (top === null) { top = r.top; continue; }
      if (Math.abs(r.top - top) > 2) {            // this character starts a new line
        rows.push(source.slice(start, i - 1));
        start = i - 1;
        top = r.top;
      }
    }
    rows.push(source.slice(start));

    el.textContent = '';
    rows.map(r => r.trim()).filter(Boolean).forEach((row, i) => {
      const wrap = doc.createElement('span');
      wrap.className = 'split-wrap';
      const line = doc.createElement('span');
      line.className = 'line';
      line.style.setProperty('--i', i);
      line.textContent = row;
      wrap.appendChild(line);
      el.appendChild(wrap);
    });
  };

  const relineAll = () => $$('[data-split-lines]').forEach(splitLines);
  const settleLines = () => $$('[data-split-lines]').forEach(el => {
    const holder = el.closest('.is-in') || (el.closest('.reveal') || {}).classList?.contains('is-in');
    if (holder) $$('.line', el).forEach(l => { l.style.transform = 'none'; l.style.opacity = '1'; });
  });

  // Fonts change the wrap points, so split once they are in.
  relineAll();
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => { relineAll(); settleLines(); });

  /* ---------------------------------------------------------
     3. Reveal on scroll
     --------------------------------------------------------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, obs) => {
        entries.forEach(e => {
          if (!e.isIntersecting) return;
          e.target.style.setProperty('--d', (e.target.dataset.delay || 0) + 'ms');
          e.target.classList.add('is-in');
          obs.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 })
    : null;

  $$('.reveal, .hr--draw').forEach(el => {
    if (el.closest('.hero')) return;               // the hero waits for the preloader
    if (io) io.observe(el); else el.classList.add('is-in');
  });

  /* ---------------------------------------------------------
     4. Scroll: header state + a slow drift on the lockup
     --------------------------------------------------------- */
  const nav = $('#nav');
  const heroLogo = $('#heroLogo');
  const layers = $$('.hero__layer');
  let lastY = 0;
  let ticking = false;

  const onScroll = () => {
    const y = scrollY;

    if (nav) {
      nav.classList.toggle('is-stuck', y > 40);
      nav.classList.toggle('is-hidden', y > 420 && y > lastY + 4);
    }

    if (!reduced && y < innerHeight * 1.2) {
      if (heroLogo) heroLogo.style.transform = `translate3d(0, ${(y * 0.09).toFixed(2)}px, 0)`;
      layers.forEach(l => {
        const d = parseFloat(l.dataset.depth || 0.1);
        l.style.transform = `translate3d(0, ${(y * d).toFixed(2)}px, 0) scale(${1 + d * 0.06})`;
      });
    }

    lastY = y;
    ticking = false;
  };

  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     5. Pointer: cursor, ambient glow, magnetic buttons, tilt
     --------------------------------------------------------- */
  if (finePointer && !reduced) {
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    const glow = $('#glow');

    const p = { x: innerWidth / 2, y: innerHeight / 2 };
    const soft = { x: p.x, y: p.y };
    const slow = { x: p.x, y: p.y };

    addEventListener('pointermove', e => { p.x = e.clientX; p.y = e.clientY; }, { passive: true });

    const hot = 'a, button, input, .card, [data-tilt]';
    doc.addEventListener('pointerover', e => { if (e.target.closest(hot)) body.classList.add('cursor-hot'); });
    doc.addEventListener('pointerout',  e => { if (e.target.closest(hot)) body.classList.remove('cursor-hot'); });

    $$('[data-magnetic]').forEach(m => {
      m.addEventListener('pointermove', e => {
        const r = m.getBoundingClientRect();
        m.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.14}px, ` +
                            `${(e.clientY - (r.top + r.height / 2)) * 0.22}px)`;
      });
      m.addEventListener('pointerleave', () => { m.style.transform = ''; });
    });

    $$('[data-tilt]').forEach(t => {
      t.addEventListener('pointermove', e => {
        const r = t.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 7;
        t.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
      });
      t.addEventListener('pointerleave', () => { t.style.transform = ''; });
    });

    const trail = () => {
      soft.x = lerp(soft.x, p.x, 0.35); soft.y = lerp(soft.y, p.y, 0.35);
      slow.x = lerp(slow.x, p.x, 0.055); slow.y = lerp(slow.y, p.y, 0.055);
      if (dot)  dot.style.transform  = `translate(${p.x}px, ${p.y}px) translate(-50%,-50%)`;
      if (ring) ring.style.transform = `translate(${soft.x}px, ${soft.y}px) translate(-50%,-50%)`;
      if (glow) glow.style.transform = `translate3d(${slow.x}px, ${slow.y}px, 0)`;
      requestAnimationFrame(trail);
    };
    requestAnimationFrame(trail);
  }

  /* ---------------------------------------------------------
     5b. Film grain — a few noise tiles, cycled on a canvas
     --------------------------------------------------------- */
  const grain = $('#grain');
  if (grain && !reduced) {
    const ctx = grain.getContext('2d', { alpha: true });
    const TILE = 180;
    const frames = [];
    let idx = 0;

    for (let f = 0; f < 4; f++) {
      const c = doc.createElement('canvas');
      c.width = c.height = TILE;
      const cc = c.getContext('2d');
      const img = cc.createImageData(TILE, TILE);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
      cc.putImageData(img, 0, 0);
      frames.push(c);
    }

    const size = () => { grain.width = innerWidth; grain.height = innerHeight; };
    const paint = () => {
      ctx.clearRect(0, 0, grain.width, grain.height);
      ctx.fillStyle = ctx.createPattern(frames[idx++ % frames.length], 'repeat');
      ctx.fillRect(0, 0, grain.width, grain.height);
    };

    size(); paint();
    setInterval(paint, 90);
    addEventListener('resize', () => { size(); paint(); }, { passive: true });
  }

  /* ---------------------------------------------------------
     6. Marquee — duplicate the track so the loop is seamless
     --------------------------------------------------------- */
  const track = $('#marqueeTrack');
  if (track) track.innerHTML += track.innerHTML;

  /* ---------------------------------------------------------
     7. Language toggle (HR / EN)
     --------------------------------------------------------- */
  const langBtn = $('#lang');

  const applyLang = (lang) => {
    html.dataset.lang = lang;
    html.lang = lang;

    $$('[data-hr][data-en]').forEach(el => {
      const val = el.dataset[lang];
      if (val == null) return;
      if (el.hasAttribute('data-split-lines')) {
        el.dataset.raw = val;
        el.textContent = val;
        splitLines(el);
      } else {
        el.innerHTML = val;
      }
    });
    settleLines();

    $$('[data-hr-ph][data-en-ph]').forEach(el => {
      el.placeholder = el.dataset[lang + 'Ph'] || el.placeholder;
    });

    if (langBtn) $$('.lang__opt', langBtn).forEach(o => o.classList.toggle('is-on', o.dataset.set === lang));

    doc.title = lang === 'en'
      ? 'Terra Restaurant — Opening soon'
      : 'Terra Restoran — Uskoro otvaramo';

    try { localStorage.setItem('terra:lang', lang); } catch (_) {}
  };

  let saved = null;
  try { saved = localStorage.getItem('terra:lang'); } catch (_) {}
  if (saved && saved !== 'hr') applyLang(saved);

  if (langBtn) langBtn.addEventListener('click', () => {
    applyLang(html.dataset.lang === 'hr' ? 'en' : 'hr');
  });

  /* ---------------------------------------------------------
     8. Odds and ends
     --------------------------------------------------------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { relineAll(); settleLines(); }, 200);
  }, { passive: true });

  bootLoader();
})();
