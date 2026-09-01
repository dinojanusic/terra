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
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

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

    const step = () => {
      shown = lerp(shown, target, 0.12);
      if (loaderBar) loaderBar.style.width = shown.toFixed(1) + '%';
      if (!done || shown < 99.4) requestAnimationFrame(step);
      else finish();
    };
    const finish = () => {
      if (loaderBar) loaderBar.style.width = '100%';
      loader.classList.add('is-done');
      body.classList.remove('is-loading');
      html.classList.add('is-ready');
      setTimeout(() => loader.remove(), 800);
      startHero();
    };

    const ready = Promise.all([
      new Promise(res => (doc.fonts && doc.fonts.ready ? doc.fonts.ready.then(res) : res())),
      new Promise(res => (doc.readyState === 'complete' ? res() : addEventListener('load', res, { once: true }))),
      new Promise(res => setTimeout(res, reduced ? 0 : 550))
    ]);

    const creep = setInterval(() => { target = Math.min(target + Math.random() * 16, 92); }, 260);
    ready.then(() => { clearInterval(creep); target = 100; done = true; });

    if (reduced) { clearInterval(creep); done = true; shown = 100; finish(); return; }
    requestAnimationFrame(step);
  };

  /* ---------------------------------------------------------
     2. Split text — chars for the wordmark, lines elsewhere
     --------------------------------------------------------- */
  const splitChars = (el) => {
    const text = el.textContent.trim();
    el.textContent = '';
    [...text].forEach((ch, i) => {
      const s = doc.createElement('span');
      s.className = 'char';
      s.style.setProperty('--i', i);
      s.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(s);
    });
  };

  // Splits on natural word-wrap boundaries by measuring offsetTop per word.
  const splitLines = (el) => {
    const source = el.dataset.raw || el.textContent.trim();
    el.dataset.raw = source;
    el.textContent = '';

    const words = source.split(/\s+/).map(w => {
      const s = doc.createElement('span');
      s.textContent = w + ' ';
      s.style.display = 'inline-block';
      el.appendChild(s);
      return s;
    });

    const rows = [];
    let top = null;
    words.forEach(w => {
      if (top === null || Math.abs(w.offsetTop - top) > 2) { rows.push([]); top = w.offsetTop; }
      rows[rows.length - 1].push(w.textContent);
    });

    el.textContent = '';
    rows.forEach((row, i) => {
      const wrap = doc.createElement('span');
      wrap.className = 'split-wrap';
      const line = doc.createElement('span');
      line.className = 'line';
      line.style.setProperty('--i', i);
      line.textContent = row.join('').trim();
      wrap.appendChild(line);
      el.appendChild(wrap);
    });
  };

  $$('[data-split]').forEach(splitChars);
  const relineAll = () => $$('[data-split-lines]').forEach(splitLines);
  relineAll();

  const startHero = () => {
    $$('[data-split]').forEach(el => el.classList.add('is-in'));
    $$('.hero .reveal').forEach(el => el.classList.add('is-in'));
  };

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

  $$('.reveal').forEach(el => (io ? io.observe(el) : el.classList.add('is-in')));

  /* ---------------------------------------------------------
     4. Scroll: nav state + hero parallax (single rAF loop)
     --------------------------------------------------------- */
  const nav = $('#nav');
  const layers = $$('.hero__layer');
  let lastY = 0;
  let ticking = false;

  const onScroll = () => {
    const y = scrollY;

    if (nav) {
      nav.classList.toggle('is-stuck', y > 40);
      nav.classList.toggle('is-hidden', y > 420 && y > lastY + 4);
    }

    if (!reduced) {
      const vh = innerHeight;
      if (y < vh * 1.2) {
        layers.forEach(l => {
          const d = parseFloat(l.dataset.depth || 0.1);
          l.style.transform = `translate3d(0, ${(y * d).toFixed(2)}px, 0) scale(${1 + d * 0.06})`;
        });
      }
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
    const cursor = $('#cursor');
    const dot = $('.cursor__dot');
    const ring = $('.cursor__ring');
    const glow = $('#glow');

    const p = { x: innerWidth / 2, y: innerHeight / 2 };
    const soft = { x: p.x, y: p.y };
    const slow = { x: p.x, y: p.y };

    addEventListener('pointermove', e => { p.x = e.clientX; p.y = e.clientY; }, { passive: true });

    const hot = 'a, button, input, .card, [data-tilt]';
    doc.addEventListener('pointerover', e => {
      if (e.target.closest(hot)) body.classList.add('cursor-hot');
    });
    doc.addEventListener('pointerout', e => {
      if (e.target.closest(hot)) body.classList.remove('cursor-hot');
    });

    const magnets = $$('[data-magnetic]');
    magnets.forEach(m => {
      m.addEventListener('pointermove', e => {
        const r = m.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        m.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
      });
      m.addEventListener('pointerleave', () => { m.style.transform = ''; });
    });

    $$('[data-tilt]').forEach(t => {
      t.addEventListener('pointermove', e => {
        const r = t.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 8;
        t.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
        t.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        t.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      t.addEventListener('pointerleave', () => { t.style.transform = ''; });
    });

    const trail = () => {
      soft.x = lerp(soft.x, p.x, 0.35);
      soft.y = lerp(soft.y, p.y, 0.35);
      slow.x = lerp(slow.x, p.x, 0.055);
      slow.y = lerp(slow.y, p.y, 0.055);

      if (dot) dot.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%,-50%)`;
      if (ring) ring.style.transform = `translate(${soft.x}px, ${soft.y}px) translate(-50%,-50%)`;
      if (glow) glow.style.transform = `translate3d(${slow.x}px, ${slow.y}px, 0)`;
      requestAnimationFrame(trail);
    };
    if (cursor || glow) requestAnimationFrame(trail);
  }

  /* ---------------------------------------------------------
     6. Film grain — small tile, redrawn a few times a second
     --------------------------------------------------------- */
  const grain = $('#grain');
  if (grain && !reduced) {
    const ctx = grain.getContext('2d', { alpha: true });
    const TILE = 180;
    let frames = [];
    let idx = 0;

    const build = () => {
      frames = [];
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
    };

    const size = () => {
      grain.width = innerWidth;
      grain.height = innerHeight;
    };

    const paint = () => {
      if (!frames.length) return;
      const pat = ctx.createPattern(frames[idx++ % frames.length], 'repeat');
      ctx.clearRect(0, 0, grain.width, grain.height);
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, grain.width, grain.height);
    };

    build();
    size();
    paint();
    setInterval(paint, 90);
    addEventListener('resize', () => { size(); paint(); }, { passive: true });
  }

  /* ---------------------------------------------------------
     7. Marquee — duplicate the track so the loop is seamless
     --------------------------------------------------------- */
  const track = $('#marqueeTrack');
  if (track) track.innerHTML += track.innerHTML;

  /* ---------------------------------------------------------
     8. Countdown
     --------------------------------------------------------- */
  const notify = $('#notify');
  const cells = { d: $('#cd-d'), h: $('#cd-h'), m: $('#cd-m'), s: $('#cd-s') };

  if (notify && cells.d) {
    const target = new Date(notify.dataset.open).getTime();
    const pad = n => String(Math.max(0, n)).padStart(2, '0');

    const set = (el, val) => {
      if (!el || el.textContent === val) return;
      el.textContent = val;
      if (reduced) return;
      el.classList.remove('tick');
      void el.offsetWidth;      // restart the animation
      el.classList.add('tick');
    };

    const tick = () => {
      const left = Math.max(0, target - Date.now());
      const s = Math.floor(left / 1000);
      set(cells.d, pad(Math.floor(s / 86400)));
      set(cells.h, pad(Math.floor(s / 3600) % 24));
      set(cells.m, pad(Math.floor(s / 60) % 60));
      set(cells.s, pad(s % 60));
    };

    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------
     9. Signup form — front-end only; POST it to your ESP later
     --------------------------------------------------------- */
  const form = $('#form');
  if (form) {
    const input = $('#email', form);
    const note = $('#formNote');
    const valid = v => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v.trim());

    const say = (state, hr, en) => {
      form.classList.remove('is-error', 'is-ok');
      if (state) form.classList.add(state);
      if (!note) return;
      note.dataset.hr = hr;
      note.dataset.en = en;
      note.innerHTML = html.dataset.lang === 'en' ? en : hr;
    };

    form.addEventListener('submit', e => {
      e.preventDefault();
      const v = input ? input.value : '';

      if (!valid(v)) {
        say('is-error', 'Provjerite e-mail adresu.', 'Please check that email address.');
        if (input) input.focus();
        return;
      }

      try {
        const list = JSON.parse(localStorage.getItem('terra:list') || '[]');
        if (!list.includes(v.trim().toLowerCase())) list.push(v.trim().toLowerCase());
        localStorage.setItem('terra:list', JSON.stringify(list));
      } catch (_) { /* private mode — nothing to keep */ }

      say('is-ok', 'Hvala. Javljamo se prvi dan.', 'Thank you. We write on day one.');
      form.reset();
    });

    if (input) input.addEventListener('input', () => {
      if (form.classList.contains('is-error')) {
        say('', 'Jedna poruka kad otvorimo rezervacije. Ništa više.', 'One email when reservations open. Nothing else.');
      }
    });
  }

  /* ---------------------------------------------------------
     10. Language toggle (HR / EN)
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
        el.closest('.reveal')?.classList.add('is-in');
        $$('.line', el).forEach(l => l.style.transform = 'none');
        $$('.line', el).forEach(l => l.style.opacity = '1');
      } else {
        el.innerHTML = val;
      }
    });

    $$('[data-hr-ph][data-en-ph]').forEach(el => {
      el.placeholder = el.dataset[lang + 'Ph'] || el.placeholder;
    });

    if (langBtn) $$('.lang__opt', langBtn).forEach(o => o.classList.toggle('is-on', o.dataset.set === lang));

    doc.title = lang === 'en'
      ? 'Terra — Restaurant · Opening soon'
      : 'Terra — Restoran · Uskoro otvaramo';

    try { localStorage.setItem('terra:lang', lang); } catch (_) {}
  };

  let saved = null;
  try { saved = localStorage.getItem('terra:lang'); } catch (_) {}
  if (saved && saved !== 'hr') applyLang(saved);

  if (langBtn) langBtn.addEventListener('click', () => {
    applyLang(html.dataset.lang === 'hr' ? 'en' : 'hr');
  });

  /* ---------------------------------------------------------
     11. Odds and ends
     --------------------------------------------------------- */
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      relineAll();
      $$('[data-split-lines]').forEach(el => {
        const holder = el.closest('.reveal');
        if (holder && holder.classList.contains('is-in')) {
          $$('.line', el).forEach(l => { l.style.transform = 'none'; l.style.opacity = '1'; });
        }
      });
    }, 200);
  }, { passive: true });

  bootLoader();
})();
