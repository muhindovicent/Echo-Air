# Echo & Air — phased redesign roadmap

## Verified baseline (GitHub source inspection, 10 Nov 2026)

The repository has seven root-level source/configuration files: `index.html`, `Echo and Air.html`, `shop.html`, `drop.html`, `about.html`, `echo and air.css`, and a misnamed `gitignore`.

- Two competing homepage/style implementations coexist: cream/red inline CSS in `index.html` and dark theme in `Echo and Air.html` plus `echo and air.css`.
- `shop.html`, `drop.html`, and the alternative homepage reference missing `js/data.js` and `js/main.js`.
- Some navigation targets do not exist, including `drops.html`, `wishlist.html`, and product detail pages.
- Old `RAWLINE` branding appears in copy and page metadata.
- No package manifest, backend, real inventory source, checkout, or automated tests exist in the inspected repository.
- Source-based issues are **not** a substitute for browser QA; runtime testing is still required.

## Principles

1. Preserve `main`; work in feature branches and review pull requests.
2. Avoid polishing duplicate legacy pages. Build **one canonical storefront**.
3. Brand expression belongs in campaign imagery and typography; purchase flows must remain clear.
4. Never fabricate customer reviews, stock, shipping terms, testimonials, prices, or product photos.
5. Do not accept payments or publish checkout claims without a verified commerce provider.
6. Build mobile-first, use semantic accessible controls, optimize images, and test each phase.

## Phase 1 — foundation (complete)

- [x] Create feature branch `redesign/phase-01-foundation`.
- [x] Replace `gitignore` with working `.gitignore`.
- [x] Add README and document existing run method.
- [x] Record defects and phased migration plan.
- [ ] Confirm real product categories, target customers, pricing/currency, delivery coverage, brand assets, and whether live checkout is needed.
- [ ] Capture baseline desktop/mobile screenshots and browser console errors on developer's local machine.
- [ ] Decide: Shopify theme for fastest business launch or custom Next.js + Shopify for engineering control.

**Exit criteria:** the current prototype remains recoverable, there are no tracked credentials, agreed architecture and business requirements are written down, and baseline UI issues are reproducible.

## Phase 2 — brand and reusable UI foundation

**Delivered in `feat/phase-01-nextjs-foundation`** (homepage + frontend
foundation):

- [x] Replace the static prototype with a Next.js App Router project
      (TypeScript, Tailwind CSS v4) at the repository root; the original files
      are preserved in `legacy/`.
- [x] Establish the visual direction: obsidian `#0B0D10`, off-white `#F5F5F0`,
      acid-green `#C9F64A`, Space Grotesk + IBM Plex Mono, cinematic lighting,
      oversized editorial type, restrained motion.
- [x] Document spacing, typography, contrast, components, motion and
      responsive rules in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).
- [x] Build one canonical homepage (the two legacy homepages are retired to
      `legacy/`).
- [x] Implement an accessible header, responsive navigation with a working
      mobile menu, footer, buttons and a fixed-ratio image frame component.
- [x] Keep every placeholder frame labelled as a concept asset and remove all
      dead navigation targets from the new build.
- [x] Add a Playwright smoke suite (homepage rendering, dead links, responsive
      layout and horizontal overflow, mobile menu, image loading, reduced
      motion) and run it in CI against the production build.

**Decisions taken in this phase**

- *Palette.* The earlier note proposed warm cream and near-black with a
  red-orange accent. That palette was inherited from the legacy `index.html`,
  so reusing it would have made the rebuild read as a restyle. The direction
  is now obsidian / off-white / acid-green with a monochrome + acid duotone
  grade applied to all placeholder imagery.
- *Imagery.* No real brand photography exists yet. The legacy stock frames
  are kept in `assets/concept-source/`, cropped into `public/concept/` by
  `tools/crop_concept_assets.py` (crops remove the third-party marks visible
  in the raw stock) and tagged "Concept" on screen.
- *Navigation.* With no catalog pages yet, the primary navigation points at
  homepage sections instead of shipping links to routes that do not exist.
- *Unverified brand details.* The placeholder contact email and fictional
  studio address carried over from the legacy prototype were removed. The
  footer now states that no verified contact channel exists, and the Playwright
  suite asserts that no invented contact data reappears.
- *Commerce.* Still out of scope. No cart, checkout, payment form, stock
  level, price or review is presented anywhere in this build.

**Still open**

- [ ] Confirm real product categories, target customers, pricing/currency,
      delivery coverage, brand assets, and whether live checkout is needed.
- [ ] Capture baseline desktop/mobile screenshots and browser console errors
      on developer's local machine.
- [ ] Decide: Shopify theme for fastest business launch or custom
      Next.js + Shopify for engineering control.

**Exit criteria (met):** one coherent brand direction, working responsive
navigation, no dead primary navigation, a documented design system and a
green lint/typecheck/production build.

## Phase 3 — catalog and product discovery

**Delivered in `feat/phase-02-product-catalog`** (demonstration catalogue):

- [x] Introduce a strongly typed product model (`lib/products.ts`) with
      working titles, categories, concept construction notes and concept
      imagery — deliberately with no price, stock, size, review or purchase
      field.
- [x] Build `/shop` with an editorial heading, responsive product grid,
      product cards, category navigation with counts and a product-count
      display.
- [x] Implement working search, category filtering, sorting, active-filter
      indicators, clear-filters and an empty state that explains how to
      recover.
- [x] Provide a desktop filter sidebar and an accessible mobile filter panel
      built on the shared modal contract.
- [x] Add `/shop/[slug]` preview routes (12 static paths) so every card leads
      to a working page, with sibling-piece and category links.
- [x] Extend the navigation and the homepage so the catalogue is reachable,
      without breaking the existing homepage sections.
- [x] Extend the Playwright suite to cover search, filtering, sorting, active
      indicators, empty states, product navigation and the mobile panel.

**Still open for the next phase**

- [ ] Replace the demonstration catalogue with a real data source (typed
      product records, variants, sizes and availability).
- [ ] Product configuration and purchasing: variant selection, stock-aware
      "add to bag", cart and hosted checkout (see Phase 4).
- [ ] Replace concept imagery with studio photography.

## Phase 3b — advanced product experience

**Delivered in `feat/phase-03-product-experience`** (frontend interactions only):

- [x] Interactive product gallery: thumbnail rail, frame switching, an
      enlarged view with the same keyboard controls, and arrow-key navigation
      on the stage and on the rail.
- [x] Per-product views are crops of the same source frame, so a gallery never
      presents an unrelated photograph as another view of the same garment, and
      a single-frame product renders without switching controls.
- [x] Reusable size and colourway selectors built on real radio inputs and
      labelled as demonstration variants.
- [x] A demonstration size guide dialog that publishes no measurements.
- [x] A wishlist held in React state and `localStorage`, with add/remove, a
      `/wishlist` page, designed empty states and a count in the header.
- [x] Cinematic frame presentation (key light, vignette, cross-fade) with the
      existing reduced-motion rules applied.

**Still out of scope**

- Payments, authentication, stock management and checkout.
- Anything that would present a demonstration piece as purchasable: there is
  no price, no availability, no stock level and no ordering path anywhere in
  the build.

## Phase 4A — functional demonstration shopping bag

**Delivered in `feat/phase-04-shopping-bag`** (frontend interactions only):

- [x] A typed bag model (`lib/bag.ts`) storing only the product slug, the
      selected demonstration size, the colourway id and a quantity, validated
      against the current catalogue on read and merged by selection.
- [x] A bag store separate from the wishlist, kept in React state, mirrored to
      `localStorage`, hydrated through `useSyncExternalStore` and
      synchronised across tabs.
- [x] An **Add to Demo Bag** action wired to the existing size and colour
      selectors, with visible pending feedback and a live confirmation.
- [x] A responsive bag drawer and a `/bag` page with frames, selections,
      quantity increase/decrease, removal, clear-all and designed empty states.
- [x] A bag button with an item count in the desktop header and the mobile
      menu.
- [x] Keyboard-accessible drawer (focus moved in, focus trapped, `Escape`
      closes, focus returned to the button that opened it) and reduced-motion
      support through the existing motion rules.
- [x] No prices, totals, stock, delivery, checkout or payment: the bag is
      labelled as a demonstration and the tests assert it.

**Still open**

- [ ] A real product source, priced variants and stock-aware behaviour.
- [ ] A priced cart, hosted checkout and payments (Phase 4B).

## Phase 4 — commerce integration

- Connect the selected provider (recommended: Shopify if live online sales are required).
- Implement variant validation, stock-aware Add to Bag, persistent cart, quantity editing, and secure hosted checkout handoff.
- Verify the store's actual shipping/payment market support before making public claims.
- Test successful and failed customer journeys, without collecting card credentials in custom forms.

**Exit criteria:** a tested cart-to-provider-checkout flow with genuine catalog data and explicit business approval.

## Phase 5 — launch quality

- Keyboard access and WCAG 2.2 AA checks; mobile navigation, filter and cart testing.
- Metadata, sitemap, canonical URLs, structured Product data based on accurate price and stock.
- Performance targets: Core Web Vitals LCP <= 2.5s, INP <= 200ms, CLS <= 0.1 at the 75th percentile.
- Playwright tests for browsing/variant/cart/checkout handoff and CI checks for build and lint.
- Preview deployment, stakeholder review, then production launch.

**Exit criteria:** tests pass, no dead primary navigation, production data is legitimate, delivery/returns/contact policies are published, and launch is approved.

## Architecture decision still open

**A. Shopify Online Store theme:** lower maintenance and faster sales launch; less custom UI freedom.

**B. Next.js + TypeScript + Shopify Storefront API:** bespoke editorial experience, reusable frontend, strong developer control; higher development and maintenance overhead.

Do not adopt the headless option merely to make the technology stack look sophisticated. Confirm commercial needs first.

## Suggested next pull request

`redesign/phase-02-design-system`: choose the canonical visual direction, create tokens and a responsive shared header/footer, and replace dead nav links with genuine destinations or remove them. Keep the first PR scoped: **no payment or inventory integration**.
