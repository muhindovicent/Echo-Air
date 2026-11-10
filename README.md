# Echo & Air

A clothing-brand website currently in prototype form. This repository is undergoing an incremental redesign toward a responsive, accessible storefront with a complete product-to-checkout experience.

## Current repository state (Phase 1 baseline)

The original project is a **static HTML/CSS prototype**, not yet a functioning e-commerce application.

- `index.html` is the main standalone landing page with inline styles.
- `Echo and Air.html` is an alternative homepage, with styles from `echo and air.css`.
- `shop.html`, `drop.html`, and `about.html` use the alternative design.
- The alternative pages reference `js/data.js` and `js/main.js`, but these scripts are absent from the checked-in repository.
- Several existing navigation links reference missing pages (including `drops.html` and `wishlist.html`).
- There is no product checkout, order backend, or configured commerce service.

**Do not interpret visible product cards or checkout-style elements as real transactions.** The legacy source is retained so it can be reviewed while a replacement is built.

## View the existing site locally

No `npm install` is needed for the current static source.

1. Open the project folder in VS Code.
2. Run a local HTTP server from the project root:
   - Windows with Python: `py -m http.server 5500`
   - macOS/Linux with Python: `python3 -m http.server 5500`
3. Open `http://localhost:5500/index.html` in your browser.

The standalone landing page is expected to load, but its commerce controls are largely placeholders. The alternate pages may show missing-resource errors in the browser console. No complete browser test of the site has been recorded.

## Redesign workflow

See [the phased roadmap](docs/REDESIGN_ROADMAP.md).

Development must happen on a separate branch with a pull request; keep `main` as the baseline until changes are reviewed. Phase 1 only corrects repository hygiene and documents the migration: **no HTML/CSS redesign is being claimed yet**.

## Proposed stack (pending business confirmation)

- Next.js + TypeScript for a custom storefront
- Responsive styles and shared design tokens
- Shopify for products, variants, cart, inventory, and hosted checkout if the business will sell online
- Automated accessibility and end-to-end tests before production launch

A simpler Shopify Online Store theme is also a valid alternative if rapid business launch is more important than a bespoke custom frontend. Do not create a home-built payment-card form.
