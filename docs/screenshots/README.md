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
| `product-desktop-1440.jpg` | Product preview 1440×900, full page |
| `product-mobile-375.jpg` | Product preview 375×812, full page |

Regenerate:

```bash
npm run build
npm run test:e2e -- tests/e2e/screenshots.spec.ts
python tools/compress_screenshots.py
```

All imagery in these captures is placeholder concept art, tagged "Concept" in
the interface.
