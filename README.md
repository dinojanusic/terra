# Terra — coming soon

A single-page "opening soon" site for Terra restaurant. Static HTML, CSS and
vanilla JavaScript — no build step, no dependencies, no tracking.

```
index.html
assets/
  css/style.css     design tokens, layout, motion
  js/main.js        preloader, split-text, reveals, parallax, countdown, i18n
  img/              favicon + Open Graph card (SVG)
```

## Run it

Any static server works:

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Deploy by uploading the folder as-is (Netlify, Vercel, Cloudflare Pages,
GitHub Pages, or plain nginx).

## What's inside

- **Preloader** with a progress bar tied to real font + `load` readiness.
- **Hero** with a gradient wordmark that animates in per character, three
  parallax depth layers, and a pulsing ember glow.
- **Scroll reveals** via `IntersectionObserver`, with per-element delays
  (`data-delay="120"`).
- **Line-split headings** (`data-split-lines`) measured from real wrap points,
  re-split on resize and on language change.
- **Pointer work** on fine pointers only: custom cursor, an ambient glow that
  trails the pointer, magnetic buttons (`data-magnetic`), 3D tilt (`data-tilt`).
- **Film grain** — four pre-rendered noise tiles cycled on a canvas.
- **Countdown** to the opening moment, with a per-digit tick animation.
- **HR / EN toggle**, persisted in `localStorage`.
- **Signup form** with client-side validation.
- **No-JS fallback** — a `<noscript>` block in `<head>` drops the preloader,
  renders every animated element in its final state and hides the countdown.
- `prefers-reduced-motion` is respected throughout: all motion, the cursor,
  the glow and the grain switch off, and content renders in its final state.

## Things to change before launch

1. **Opening date** — `data-open` on `<section id="notify">` in `index.html`
   (ISO 8601 with offset). The heading text above it is separate copy; update
   both. Change the countdown, and change `Otvaramo 2026.` in the hero eyebrow.
2. **Contact details** — address, hours, phone, email and social links live in
   the footer and in the JSON-LD block in `<head>`.
3. **Signup endpoint** — `assets/js/main.js`, section 9. It currently validates
   and stores addresses in `localStorage` only, so nothing leaves the browser.
   Replace that with a `fetch()` POST to your mail provider (Mailchimp,
   Buttondown, Brevo…) or your own endpoint.
4. **Photography** — the framed image in the story section is a CSS gradient
   placeholder (`.frame__img--soil`). Swap it for a real photo: put an `<img>`
   inside `.frame` and drop the background rules.
5. **Menu copy** — the three dishes are placeholder writing.
6. **OG image** — `assets/img/og.svg` is a generated card. Most social
   platforms prefer a 1200×630 JPG/PNG; export one and update the
   `og:image` meta tag.

## Design tokens

Colors, type scale and rhythm are all CSS custom properties at the top of
`style.css` (`--soil`, `--bone`, `--ember`, `--olive`, `--clay`, the `--step-*`
type scale). Re-theming is a matter of editing that block.

## Browser support

Current Chrome, Safari, Firefox and Edge. `backdrop-filter`,
`background-clip: text` and `svh` units degrade gracefully where unsupported.
