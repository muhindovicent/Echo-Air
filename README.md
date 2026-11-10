# Echo & Air

Phase 01 of the Echo & Air storefront rebuild: a Next.js (App Router) +
TypeScript + Tailwind CSS frontend foundation and a new homepage.

**Status: concept build.** No catalog, cart, checkout, account or backend
exists yet, and nothing on the site can be ordered. Every photograph is
placeholder art carried over from the legacy prototype and tagged "Concept" on
screen. Garment names are working titles. No contact details, address, social
accounts, pricing, stock levels or reviews are published, because none have
been confirmed by the business.

## Stack

- Next.js 16 (App Router, Turbopack, static prerender)
- React 19, TypeScript (strict)
- Tailwind CSS v4 (CSS-first tokens in `app/globals.css`)
- `next/font` — Space Grotesk + IBM Plex Mono, self-hosted

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build         # production build (static prerender)
npm run start         # serve the production build
npm run lint          # ESLint (eslint-config-next, flat config)
npm run typecheck     # tsc --noEmit
npm run test          # build + Playwright smoke tests
npm run test:e2e      # Playwright smoke tests (needs a build first)
```

Node 20.9+ is required by Next.js 16.

## Tests

Playwright smoke tests run against the **production build**, not the dev
server, so what is tested is what ships.

```bash
npm run test:e2e:install   # one-time: download the Chromium build
npm run test               # build + run the suite
```

The suite covers homepage rendering and landmarks, dead-link detection,
navigation anchors, responsive layout and horizontal overflow at 375 / 768 /
1440 / 1920 px, the mobile menu (focus move, focus trap, Escape, scroll lock),
image loading, skip link, heading order, focus visibility and
`prefers-reduced-motion`. `tests/e2e/screenshots.spec.ts` also regenerates the
review captures in `docs/screenshots/`.

## Project structure

```
app/                  App Router entry points
  layout.tsx          Fonts, metadata, header/footer shell, skip link
  page.tsx            Homepage composition
  globals.css         Design tokens, base layer, motion rules
  icon.svg            Favicon
components/
  chrome/             SiteHeader (incl. mobile menu), SiteFooter
  sections/           Hero, NewArrivals, Lookbook, BrandStory, ClosingBand
  ui/                 ActionLink, ConceptFigure, Reveal
lib/
  content.ts          Typed editorial content + concept image map
  cn.ts               Class-name joiner
tests/e2e/            Playwright smoke tests
docs/                 Roadmap, design system and review screenshots
assets/concept-source/ Untouched legacy frames (provenance)
public/concept/       Cropped, site-ready concept frames
tools/                crop_concept_assets.py, compress_screenshots.py
legacy/               The original static prototype, preserved verbatim
```

## Concept assets

The legacy site hot-linked stock photography. Those frames are kept for
provenance in `assets/concept-source/` and cropped into `public/concept/` by
`tools/crop_concept_assets.py` (needs Python + Pillow). The crops remove the
third-party marks visible in the raw stock, and the site applies a single
monochrome + acid-green duotone so the placeholders read as one campaign.

```bash
python -m pip install pillow
python tools/crop_concept_assets.py
```

Real brand photography replaces these in a later phase; see
[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

## Legacy prototype

`legacy/` holds the original static site (`index.html`, `Echo and Air.html`,
`shop.html`, `drop.html`, `about.html`, `echo and air.css`) exactly as it was,
so it can still be reviewed while the replacement is verified. It references
missing scripts (`js/data.js`, `js/main.js`) and several dead links, and none
of its commerce controls are real.

To view it: serve the `legacy/` folder over HTTP, e.g.
`py -m http.server 5500` from inside `legacy/`.

## Documentation

- [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) — tokens, type, components,
  motion, accessibility and responsive rules
- [docs/REDESIGN_ROADMAP.md](docs/REDESIGN_ROADMAP.md) — phased plan and exit
  criteria
- [docs/screenshots/](docs/screenshots/) — desktop, tablet and mobile captures
  for visual review

## Scope of this phase

Implemented: design system, homepage (hero, new arrivals preview, lookbook,
brand story, closing band), responsive header with working mobile menu,
footer, accessibility and reduced-motion support, Playwright smoke tests.

Not implemented (later phases): product catalog and detail pages, search and
filtering, cart, checkout, authentication, inventory, payments, analytics.
