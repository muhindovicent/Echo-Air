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

## Phase 1 — foundation (current)

- [x] Create feature branch `redesign/phase-01-foundation`.
- [x] Replace `gitignore` with working `.gitignore`.
- [x] Add README and document existing run method.
- [x] Record defects and phased migration plan.
- [ ] Confirm real product categories, target customers, pricing/currency, delivery coverage, brand assets, and whether live checkout is needed.
- [ ] Capture baseline desktop/mobile screenshots and browser console errors on developer's local machine.
- [ ] Decide: Shopify theme for fastest business launch or custom Next.js + Shopify for engineering control.

**Exit criteria:** the current prototype remains recoverable, there are no tracked credentials, agreed architecture and business requirements are written down, and baseline UI issues are reproducible.

## Phase 2 — brand and reusable UI foundation

- Establish a two-font design system, warm cream and near-black surfaces, restrained red-orange accents.
- Document spacing, typography, contrast, components, and responsive rules.
- Choose one homepage composition; do not maintain both legacy versions.
- Implement accessible header, navigation, announcement bar, footer, buttons, and product-card shell.

**Exit criteria:** one coherent brand design and working responsive navigation, verified at mobile and desktop widths.

## Phase 3 — catalog and product discovery

- Introduce typed products, variants, images, sizes, availability, and collections.
- Implement home, shop, collections, product detail, drops and about pages.
- Add category navigation, real product links, filters/sort where inventory warrants.
- Keep placeholder/mock product data explicitly labeled as demo data.

**Exit criteria:** a visitor can reach a product from the homepage and inspect its actual purchasing details without broken links.

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
