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
  let lastY = 0;
  let ticking = false;

  const onScroll = () => {
    const y = scrollY;

    if (nav) {
      nav.classList.toggle('is-stuck', y > 40);
      nav.classList.toggle('is-hidden', y > 420 && y > lastY + 4);
    }

    if (heroLogo && !reduced && y < innerHeight * 1.2) {
      heroLogo.style.transform = `translate3d(0, ${(y * 0.09).toFixed(2)}px, 0)`;
    }

    lastY = y;
    ticking = false;
  };

  addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* ---------------------------------------------------------
     5. Magnetic buttons (fine pointers only)
     --------------------------------------------------------- */
  if (finePointer && !reduced) {
    $$('[data-magnetic]').forEach(m => {
      m.addEventListener('pointermove', e => {
        const r = m.getBoundingClientRect();
        m.style.transform = `translate(${(e.clientX - (r.left + r.width / 2)) * 0.14}px, ` +
                            `${(e.clientY - (r.top + r.height / 2)) * 0.22}px)`;
      });
      m.addEventListener('pointerleave', () => { m.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------
     6. Marquee — duplicate the track so the loop is seamless
     --------------------------------------------------------- */
  const track = $('#marqueeTrack');
  if (track) track.innerHTML += track.innerHTML;

  /* ---------------------------------------------------------
     7. Countdown
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
      const s = Math.floor(Math.max(0, target - Date.now()) / 1000);
      set(cells.d, pad(Math.floor(s / 86400)));
      set(cells.h, pad(Math.floor(s / 3600) % 24));
      set(cells.m, pad(Math.floor(s / 60) % 60));
      set(cells.s, pad(s % 60));
    };

    tick();
    setInterval(tick, 1000);
  }

  /* ---------------------------------------------------------
     8. Signup form — front-end only; POST it to your ESP later
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
        const addr = v.trim().toLowerCase();
        if (!list.includes(addr)) list.push(addr);
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
     9. Language toggle (HR / EN)
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
     10. Odds and ends
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
