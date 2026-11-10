# Echo & Air

Phase 03 of the Echo & Air storefront rebuild: a Next.js (App Router) +
TypeScript + Tailwind CSS frontend with a working demonstration catalogue and
product experience.

**Status: concept build.** No catalog data source, cart, checkout, account or
backend exists yet, and nothing on the site can be ordered. Every photograph
is placeholder art carried over from the legacy prototype and tagged "Concept"
on screen. Garment names are working titles. Sizes and colourways are
demonstration variants — no stock levels, availability, pricing, reviews or
confirmed contact details are published, because none have been confirmed by
the business.

## Stack

- Next.js 16 (App Router, Turbopack, static prerender)
- React 19, TypeScript (strict)
- Tailwind CSS v4 (CSS-first tokens in `app/globals.css`)
- `next/font` — Space Grotesk + IBM Plex Mono, self-hosted
- Playwright for the browser test suite

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
`prefers-reduced-motion`, the catalogue (search, category filter, sort,
active-filter indicators, empty state, product preview routes and the mobile
filter panel) and the product experience (gallery switching, keyboard
navigation, zoom, single-frame products, demonstration selectors, the size
guide dialog, wishlist persistence and the responsive product layout).
`tests/e2e/screenshots.spec.ts` also regenerates the review captures in
`docs/screenshots/`.

## Routes

| Route | What it is |
| --- | --- |
| `/` | Homepage: hero, new-arrivals preview, lookbook, brand story, closing band |
| `/shop` | Demonstration catalogue with search, category filter, sorting and active-filter indicators |
| `/shop/[slug]` | Product preview: interactive gallery, demonstration size/colourway selectors, size guide and wishlist action (12 static paths) |
| `/wishlist` | Pieces saved on this device (React state + `localStorage`) |
| `*` | Designed 404 page |

## Catalogue data

`lib/products.ts` holds the strongly typed demonstration catalogue: twelve
working titles across six categories, each with concept construction notes.
The model deliberately carries **no** commercial fields — there is no price,
stock state, size availability, review or purchase option, and `isConcept` /
`availability` are typed as constants so that omission is enforced by the
type system rather than by convention.

Each product lists `views`: frames that always come from the **same** source
photograph, so a gallery never presents an unrelated picture as another view
of the same garment. Products with a single frame render without a thumbnail
rail or frame navigation.

Filtering, sorting and searching happen in the browser against that static
list, so `/shop` stays a prerendered static route. The current filter state is
mirrored into the query string (`/shop?q=tee&category=jersey`) so a view can
be shared, and it is read back on load.

## Product experience

- **Gallery** — thumbnails switch the frame, the stage responds to
  `ArrowLeft`/`ArrowRight`, and a zoom button opens an enlarged view with the
  same keyboard controls. `Escape` closes it and focus returns to the button
  that opened it.
- **Variant selectors** — `OptionGroup` is a reusable radio group built on real
  radio inputs, used for the demonstration sizes and colourways. The groups
  are labelled "demonstration only" and never imply stock.
- **Size guide** — a dialog that shows the structure of a size guide with
  every measurement marked "Not published"; no garment measurements are
  invented.
- **Wishlist** — `WishlistProvider` keeps saved slugs in React state and
  mirrors them to `localStorage`, so the list survives a reload. The header
  shows the count, `/wishlist` lists the saved pieces, and both empty states
  are designed. Nothing is reserved or ordered.

## Project structure

```
app/                  App Router entry points
  layout.tsx          Fonts, metadata, header/footer shell, skip link, wishlist provider
  page.tsx            Homepage composition
  globals.css         Design tokens, base layer, motion rules
  icon.svg            Favicon
  not-found.tsx       Designed 404 page
  shop/page.tsx       Catalogue page
  shop/[slug]/page.tsx Product preview route (12 static paths)
  wishlist/page.tsx   Saved pieces
components/
  chrome/             SiteHeader (incl. mobile menu, wishlist count), SiteFooter
  sections/           Hero, NewArrivals, Lookbook, BrandStory, ClosingBand
  shop/               ShopBrowser, ProductCard, ProductGallery, ProductOptions,
                      OptionGroup, SizeGuideDialog, WishlistButton,
                      WishlistGrid, WishlistProvider, CategoryFilterList,
                      SortControl, FilterPanel
  ui/                 ActionLink, ConceptFigure, Reveal, useModalDialog
lib/
  content.ts          Typed editorial content + concept image map
  products.ts         Typed demonstration catalogue and helpers
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
footer, accessibility and reduced-motion support, Playwright smoke tests, a
functional demonstration catalogue (`/shop`) with search, category filtering,
sorting, active-filter indicators, empty states, a mobile filter panel,
product preview routes, an interactive product gallery with zoom and keyboard
controls, demonstration size and colourway selectors, a demonstration size
guide dialog and a wishlist persisted in `localStorage`.

Not implemented (later phases): a real product data source, product
configuration (sizes, variants, availability), cart, checkout, authentication,
inventory, payments, analytics.
