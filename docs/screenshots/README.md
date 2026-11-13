# Review screenshots

Captured from the production build with Playwright (`tests/e2e/screenshots.spec.ts`)
so reviewers can see the result without running the site.

| File | What it shows |
| --- | --- |
| `home-desktop-1440-fold.jpg` | Desktop 1440×900, first viewport |
| `home-desktop-1440.jpg` | Desktop 1440×900, full page |
| `home-tablet-768-fold.jpg` | Tablet 768×1024, first viewport |
| `home-tablet-768.jpg` | Tablet 768×1024, full page |
| `home-mobile-375-fold.jpg` | Mobile 375×812, first viewport |
| `home-mobile-375.jpg` | Mobile 375×812, full page |
| `mobile-menu-375.jpg` | Mobile navigation panel open |
| `shop-desktop-1440-fold.jpg` | Catalogue 1440×900, first viewport |
| `shop-desktop-1440.jpg` | Catalogue 1440×900, full page |
| `shop-mobile-375-fold.jpg` | Catalogue 375×812, first viewport |
| `shop-mobile-375.jpg` | Catalogue 375×812, full page |
| `filter-panel-375.jpg` | Mobile filter panel open at 375×812 |
| `gallery-zoom-1440.jpg` | Product frame in the full-screen view |
| `gallery-fullscreen-375.jpg` | Full-screen view on a phone, 375×812 |
| `product-desktop-1440.jpg` | Product preview 1440×900, full page |
| `product-mobile-375.jpg` | Product preview 375×812, full page |
| `wishlist-desktop-1440.jpg` | Wishlist with a saved piece, 1440×900 |
| `wishlist-mobile-375.jpg` | Wishlist with a saved piece, 375×812 |
| `bag-drawer-desktop-1440.jpg` | Demonstration bag drawer open, 1440×900 |
| `bag-drawer-mobile-375.jpg` | Demonstration bag drawer open, 375×812 |
| `bag-page-desktop-1440.jpg` | The `/bag` page with a piece in the bag |

Regenerate:

```bash
npm run build
npm run test:e2e -- tests/e2e/screenshots.spec.ts
python tools/compress_screenshots.py
```

All imagery in these captures is placeholder concept art, tagged "Concept" in
the interface.
