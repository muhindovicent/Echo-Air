# Echo & Air — design system (Phase 01)

The foundation for the Echo & Air storefront. Tokens live in `app/globals.css`
(Tailwind v4 CSS-first theme), components in `components/`, editorial copy in
`lib/content.ts`.

## 1. Brand idea

Editorial, high-contrast streetwear. The interface behaves like a lookbook:
restraint, large type, hard rules, a single loud accent. No glassmorphism, no
neon glow, no generic card grid.

## 2. Colour

| Token            | Value     | Use                                             |
| ---------------- | --------- | ----------------------------------------------- |
| `--color-obsidian` | `#0B0D10` | Page background, hero, footer base             |
| `--color-obsidian-soft` | `#101318` | Alternating section surface                |
| `--color-graphite` | `#171B21` | Reserved for raised surfaces                    |
| `--color-bone`   | `#F5F5F0`  | Primary text, rules, mobile menu surface        |
| `--color-bone-dim` | `#CBCABF` | Secondary text                                 |
| `--color-ash`    | `#8A919B`  | Tertiary text, meta labels                      |
| `--color-ink`    | `#3B4046`  | Primary text on off-white surfaces (filter panel) |
| `--color-ink-soft` | `#5B6169` | Secondary text on off-white surfaces          |
| `--color-acid`   | `#C9F64A`  | Single accent: active states, markers, one band  |

Contrast: body text is `#F5F5F0` on `#0B0D10` (~17:1). The acid accent is
used for small text on obsidian only where it clears 4.5:1, and as a surface
behind obsidian text (not as text on bone).

**Light surfaces.** The mobile filter panel sits on the off-white surface, so
components used there take a `tone="light"` variant that swaps the bone text
for the opaque `--color-ink` tones. Transparent text colours are avoided there
so the contrast does not depend on alpha compositing; the Playwright suite
asserts every control in the panel clears 4.5:1 against the panel background.

## 3. Typography

- **Space Grotesk** (`--font-display`) — headings and editorial display type.
  Self-hosted through `next/font/google`, no layout shift.
- **IBM Plex Mono** (`--font-mono`) — micro labels, metadata, indices, captions.

Scale (fluid, defined in `app/globals.css`):

| Class                | Size                            | Used for                       |
| -------------------- | ------------------------------- | ------------------------------ |
| `text-mega`          | `clamp(3rem, 11vw, 9.75rem)`    | Hero headline only             |
| `text-display`       | `clamp(2.15rem, 6.2vw, 5.75rem)` | Section titles                |
| `text-section`       | `clamp(1.7rem, 3.4vw, 3.1rem)` | Sub-section titles             |
| `text-lead`          | `clamp(1rem, 1.15vw, 1.25rem)`  | Lead paragraphs                |
| `text-micro` (`.label`) | `0.6875rem`, `0.16em` tracking | Labels, indices, meta          |

Display type is set uppercase with negative tracking. The third line of the
hero headline uses `.text-stroke` (outlined type) as the closing beat.

## 4. Layout and spacing

- Max content width `1600px`, page gutters `20px` → `40px` (`px-5 md:px-10`).
- 12-column grid (`grid-cols-12`) for desktop compositions; sections are
  stacked single-column on mobile.
- Hairline rules (`border-bone/12`) separate every band. Corners are square —
  no border radius anywhere except the 2px live indicator dot.
- Sections are separated by `border-b border-bone/12` and alternate between
  `--color-obsidian` and `--color-obsidian-soft`.

## 5. Components

| Component            | Path                              | Notes                                       |
| -------------------- | --------------------------------- | ------------------------------------------- |
| `SiteHeader`         | `components/chrome/SiteHeader.tsx`| Fixed header, announcement strip, mobile menu |
| `SiteFooter`         | `components/chrome/SiteFooter.tsx`| Navigation, contact, concept disclosure     |
| `Hero`               | `components/sections/Hero.tsx`     | Full-viewport campaign frame                 |
| `NewArrivals`        | `components/sections/NewArrivals.tsx` | Featured frame + editorial list         |
| `Lookbook`           | `components/sections/Lookbook.tsx` | Asymmetric collage                           |
| `BrandStory`         | `components/sections/BrandStory.tsx` | Studio statement + principles            |
| `ClosingBand`        | `components/sections/ClosingBand.tsx` | Acid-green statement band                |
| `ShopBrowser`        | `components/shop/ShopBrowser.tsx`  | Search, filter, sort, indicators, empty state |
| `ProductCard`        | `components/shop/ProductCard.tsx`  | Fixed-ratio card, single link target        |
| `CategoryFilterList` | `components/shop/CategoryFilterList.tsx` | Toggle buttons with `aria-pressed`   |
| `SortControl`        | `components/shop/SortControl.tsx`  | Native select, dark and light tones         |
| `FilterPanel`        | `components/shop/FilterPanel.tsx`  | Mobile filter dialog                         |
| `ActionLink`         | `components/ui/ActionLink.tsx`     | Solid / ghost / quiet link variants          |
| `ConceptFigure`      | `components/ui/ConceptFigure.tsx`  | Fixed-ratio frame, concept tag, duotone grade |
| `Reveal`             | `components/ui/Reveal.tsx`         | Intersection-observer scroll reveal          |
| `useModalDialog`     | `components/ui/useModalDialog.ts`  | Shared dialog contract (focus trap, Escape)  |

### Catalogue rules

- The catalogue model (`lib/products.ts`) has no commercial fields. `isConcept`
  is typed as the literal `true` and `availability` as `"not-for-sale"`, so a
  price or stock field cannot be added without changing the type.
- Every card links to a real preview route; there are no placeholder hrefs.
- Filtering lives in the browser so `/shop` stays statically prerendered, and
  the active state is mirrored into the query string for shareable views.
- Small screens get a condensed introduction: the catalogue heading, one short
  line of context and the search field all sit in the first viewport, and the
  full disclaimer paragraph is shown from `md` up (the footer keeps the full
  disclosure at every size).
- On a product page the main frame follows the title and description on small
  screens and moves to the right-hand column from `lg` up, so the construction
  notes never push the imagery below the fold.

### Dialogs

`useModalDialog` implements one contract for every modal surface: focus moves
into the panel, `Tab` is trapped, `Escape` closes, the background scroll is
locked, and focus is returned to the control that opened the dialog (the
menu button, the Filters button) rather than to whatever was focused before.

## 6. Imagery rules

Everything shipped today is a **concept asset**: stock frames carried over
from the legacy prototype, cropped and graded into one monochrome + acid
duotone so they read as a single campaign.

- `assets/concept-source/` — untouched legacy frames (provenance).
- `public/concept/` — cropped, site-ready versions.
- `tools/crop_concept_assets.py` — reproducible crop step (`python tools/crop_concept_assets.py`).
- Every frame renders a visible "Concept" tag, and the footer carries a
  disclosure paragraph.
- Crops deliberately exclude the third-party marks visible in the legacy stock
  (retailer labels and competitor logos).

When the studio delivers real campaign photography, drop the files into
`public/images/`, point `lib/content.ts` at them and delete the concept grade.

## 7. Motion

- One shared easing curve: `--ease-out-expo` (`cubic-bezier(0.16, 1, 0.3, 1)`).
- Scroll reveals: 800 ms fade + 20 px lift, once per element, triggered by
  `Reveal` (IntersectionObserver). Elements are only hidden when JavaScript is
  available (`.js` class on `<html>`), so content is never lost.
- Image hover: 1400 ms scale to 106% of the frame's base crop.
- No animation libraries. No parallax, no marquee, no glow.

## 8. Reduced motion and accessibility

- `prefers-reduced-motion: reduce` disables smooth scrolling, collapses all
  transitions/animations and forces revealed content to its final state
  (`app/globals.css`).
- Skip link to `#main`, landmark elements (`header`, `nav`, `main`, `footer`),
  one `h1` per page, and labelled sections (`aria-labelledby`).
- Focus is always visible: a 2 px acid outline with 3 px offset.
- Mobile menu is a labelled `role="dialog"` with `aria-modal`, focus moved in
  on open, focus trapped with `Tab`, closed with `Escape`, and the page scroll
  is locked while it is open.
- All controls are real `<button>` / `<a>` elements — no click handlers on
  `div`s.
- These behaviours are covered by the Playwright suite in `tests/e2e/`.

## 8b. Content rules for an unverified brand

Until the business confirms real details, the interface must not assert them:

- No contact email, phone number, postal address or trading details — the
  footer states that no verified channel exists yet.
- No social accounts are linked; the networks are listed as "no confirmed
  account" instead.
- No founding date, season, launch date, stockists or store locations.
- Garment names are labelled **working titles**; principles are written as
  intent ("should be", "the intent is"), not as confirmed practice.
- A `Concept disclosure` block in the footer states that the site is not a live
  store and lists everything that is placeholder.

The homepage test suite asserts the absence of invented contact data so a
placeholder address cannot reappear unnoticed.

## 9. Responsive rules

| Breakpoint | Layout                                                        |
| ---------- | ------------------------------------------------------------- |
| `< 640px`  | Single column, collage widths 78–92%, thumbnails hidden       |
| `640–1023px` | Single column with wider gutters, thumbnails visible         |
| `≥ 1024px` | 12-column compositions: 6/5 split for arrivals, 5/6/4/5 collage |
| `≥ 1280px` | Extra breathing room, footer meta column appears              |

`html` and `body` use `overflow-x: clip` so decorative offsets can never
create a horizontal scrollbar.
