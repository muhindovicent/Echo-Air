# Legacy prototype (preserved)

These files are the original static Echo & Air prototype, moved here verbatim
from the repository root during Phase 01 so the Next.js storefront could take
over the project root without losing the original source.

They are kept for reference and review only — nothing in the new storefront
depends on them, and they are not served by the Next.js app.

To view the legacy site:

```bash
cd legacy
py -m http.server 5500   # Windows
python3 -m http.server 5500   # macOS / Linux
```

Then open <http://localhost:5500/index.html>.

Known problems (unchanged from the original):

- `Echo and Air.html`, `shop.html`, `drop.html` and `about.html` reference
  `js/data.js` and `js/main.js`, which were never committed.
- Navigation targets such as `drops.html`, `wishlist.html` and the product
  pages do not exist.
- Product cards, prices and checkout-style controls are placeholders; no
  commerce backend is configured.
- The studio address, phone number and email address in these files are
  fictional placeholders from the original prototype. They are not published
  anywhere in the new storefront and should not be treated as contact details.
- Old `RAWLINE` branding appears in some copy and page metadata.
- Several hot-linked stock photographs now return 404 upstream.
