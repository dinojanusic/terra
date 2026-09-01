# Terra Restoran — coming soon

A single-page "opening soon" site for Terra Restoran, built on the **Terra 3C
Asset Kit** (the "Modernist" design system) from Claude Design. Static HTML,
CSS and vanilla JavaScript — no build step, no dependencies, no third-party
requests at runtime.

```
index.html
assets/
  css/style.css     kit tokens + components, then the page built from them
  js/main.js        preloader, line-split headings, reveals, countdown, i18n
  fonts/            Archivo (variable, 3 subsets) — self-hosted from the kit
  img/              logo, reverse logo, tree mark, favicon, OG card
```

## Run it

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Deploy the folder as-is (Netlify, Vercel, Cloudflare Pages, GitHub Pages, nginx).

## What came from the kit

Everything visual traces back to the asset kit, not to invention:

| From the kit | Used as |
| --- | --- |
| `--color-bg` `#f3f2f2`, `--color-surface` `#eae9e9`, `--color-text` `#201e1d`, the neutral ramp, `--color-divider` | Page ground, cards, ink, hairlines |
| 3C "Terracotta trunk" colorway — canopy `#6f7a52`, trunk `#8a4a2b`, ink `#3b3128` | `--color-accent` (trunk), `--color-accent-2` (canopy), placeholder plate |
| `#2b2620`, the kit's reverse-lockup ground | The dark countdown band |
| Archivo 400/600/800, `--font-heading-weight: 800`, the h1–h6 scale, `-0.015em` tracking | All type |
| 4px spacing scale, `--radius-*: 0`, `--shadow-sm/md/lg` | Rhythm, square corners, card elevation |
| `.btn` / `.btn-primary` / `.btn-secondary`, `.input`, `.card` + `.card-kicker` / `.card-title` / `.card-body`, `.hr`, `.tag`, `h6` kicker, focus and selection rules | The page is composed from these classes as-is |
| Logo lockup + reverse lockup (3C) | Hero, dark band, and — cropped to the tree — the header mark, preloader and favicon |

Additions the kit does not cover are marked `EXTENSION` in `style.css`: a
display step above the kit's 42px h1 (a landing hero needs one), page-scale
spacing continuing the same 4px base, hover/active steps for the trunk accent,
a dark-band variant of `.input`, and `.btn-lg`. Everything else is the kit.

## What's inside

- **Preloader** with a progress bar tied to real font + `load` readiness.
- **Line-split headings** (`data-split-lines`) measured from real wrap points,
  re-split after fonts load, on resize, and on language change.
- **Scroll reveals** via `IntersectionObserver` with per-element delays
  (`data-delay="120"`), plus a rule that draws itself in (`.hr--draw`).
- **Header** that hides on scroll-down and reveals the tree mark once stuck.
- **Countdown** to the opening moment, with a per-digit tick.
- **HR / EN toggle**, persisted in `localStorage`.
- **Signup form** with client-side validation.
- **No-JS fallback** — a `<noscript>` block renders every animated element in
  its final state, drops the preloader and hides the countdown.
- `prefers-reduced-motion` is respected throughout.

## Things to change before launch

1. **Opening date** — `data-open` on `<section id="notify">` (ISO 8601 with
   offset). The heading beside it and the hero kicker are separate copy.
2. **Contact details** — address, hours, phone, social links live in the footer
   and in the JSON-LD block in `<head>`.
3. **Signup endpoint** — `assets/js/main.js`, section 8. It validates and keeps
   addresses in `localStorage` only, so nothing leaves the browser. Replace it
   with a `fetch()` POST to your mail provider.
4. **Photography** — `.plate` in the story section is a flat colour-block
   placeholder in the 3C swatches. Put an `<img>` in the `<figure>` and drop it.
5. **Menu copy** — the three dishes are placeholder writing.
6. **OG image** — `assets/img/og.png` is generated from the lockup at
   1200×630; replace it with a photograph when one exists.

## Browser support

Current Chrome, Safari, Firefox and Edge. The kit leans on `color-mix()`, which
is supported across all current versions; `backdrop-filter` and `svh` degrade
gracefully.
