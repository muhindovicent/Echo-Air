# Commerce Foundation

Phase 5A establishes the data foundation for real Echo & Air merchandise.
This is **not** a storefront change: the existing demonstration catalogue,
product galleries, wishlist and demonstration shopping bag are untouched.
Commercial records live in a separate module (`lib/commerce/`) and are not
wired into the UI until a later phase.

## 1. Separation of demonstration and commercial records

| | Demonstration catalogue | Commercial catalogue |
|---|---|---|
| Module | `lib/products.ts` | `lib/commerce/` |
| Records | Concept working titles | Real merchandise |
| `isConcept` | `true` | N/A (not applicable) |
| `availability` | `"not-for-sale"` | `publicationStatus` |
| Price | None | `Price` (amount + currency) |
| Inventory | None | Derived from variant inventory |
| SKUs | None | `ProductVariant.sku` (unique) |
| Variants | Demonstration labels only | Real variants with images |
| Publishable | No | Only `publicationStatus === "published"` |

The demonstration storefront continues to render exclusively from
`lib/products.ts`. Commercial records are invisible to the UI until a future
phase connects them. Nothing in this phase can be ordered.

## 2. Commerce product model

Defined in `lib/commerce/types.ts`:

- **`CommercialProduct`** — id, slug, category, name, description, price,
  inventory, publication status, variants, timestamps
- **`ProductVariant`** — id, SKU (globally unique), size, color, variant
  images, price adjustment, inventory
- **`Price`** — amount in minor currency units + currency code (USD, EUR,
  GBP, UGX)
- **`PublicationStatus`** — `"draft"` \| `"published"` \| `"unpublished"`
- **`PublishableProduct`** — a commercial product with
  `publicationStatus === "published"`

## 3. Inventory rule

Variant inventory is the authoritative source. Product-level inventory must
equal the sum of all variant inventories. The helper
`deriveProductInventory(variants)` computes this sum. Both product-level and
variant-level inventory must be non-negative integers. Zero inventory is
valid throughout.

## 4. Runtime validation

Defined in `lib/commerce/validation.ts`. All validation is pure (no side
effects, no backend dependency) and defensive (never throws on malformed
data):

- **Price**: amount must be a non-negative integer; currency must be a
  recognized code (USD, EUR, GBP, UGX); UGX is a zero-decimal currency
- **Variant**: id and SKU must be non-empty strings without whitespace; SKU
  must be unique across the catalog; size and color are required; images must
  be a non-empty array of non-empty strings; price adjustment is an integer;
  inventory is a non-negative integer; final price (base + adjustment) must
  not be negative
- **Product**: id, slug, category, name, description are required; price is
  validated; inventory must equal the sum of variant inventories;
  publication status must be one of the three statuses; at least one variant
  is required; timestamps must be valid ISO 8601 values (not just format)
- **`validateCatalog(catalog)`**: enforces catalog-wide uniqueness of product
  IDs, slugs, variant IDs and variant SKUs; rejects malformed entries without
  throwing
- **`canPublish(product)`**: returns `true` only when the product is marked
  `published` and passes full validation
- **`canPublishInCatalog(product, catalog)`**: additionally enforces
  cross-product uniqueness of product IDs, slugs, variant IDs and variant
  SKUs against already-published products; self-exclusion uses object
  reference equality so different products sharing an ID cannot bypass
  uniqueness

Incomplete or unverified commercial records can never appear as purchasable.

## 5. Data-access boundary

Defined in `lib/commerce/store.ts`:

- **`CommerceStore`** interface: `getAllProducts`,
  `getPublishedProducts`, `getProductBySlug`, `getProductById`,
  `searchProducts`, `filterByCategory`, `validateCatalog`
- **`MemoryCommerceStore`** — in-memory implementation backed by a static
  catalog array (starts empty)
- **`commerceStore`** — default store instance bound to the empty catalog

Publication safety: `getPublishedProducts`, `searchProducts` and
`filterByCategory` all filter through `canPublishInCatalog()`, so invalid
records and records with cross-product conflicts are never returned as
purchasable.

The interface is deliberately small so a later phase can swap in a Shopify or
custom PostgreSQL backend by implementing the same methods. No backend
implementation exists in this phase. No API credentials, connection strings
or secrets are stored here.

## 6. Product import template

`data/import-template.csv` contains column headers only. No inventory,
prices or product specifications are filled in — those must come from
verified Echo & Air merchandise data. The columns are:

| Column | Description |
|---|---|
| `id` | Stable product identifier |
| `slug` | Route-friendly product identifier |
| `category` | Product category slug |
| `name` | Product name |
| `description` | Product description |
| `price_amount` | Base price in minor currency units (e.g. cents) |
| `price_currency` | `USD`, `EUR`, `GBP` or `UGX` |
| `inventory` | Total available inventory (must equal sum of variant inventories) |
| `publication_status` | `draft`, `published` or `unpublished` |
| `variant_id` | Stable variant identifier |
| `variant_sku` | Stock-keeping unit (unique across catalog) |
| `variant_size` | Size label |
| `variant_color` | Color label |
| `variant_images` | Variant-specific image sources |
| `variant_price_adjustment` | Price adjustment in minor currency units |
| `variant_inventory` | Variant inventory (non-negative integer) |
| `created_at` | ISO 8601 creation timestamp |
| `updated_at` | ISO 8601 last-update timestamp |

## 7. Publishing requirements

A commercial product may be marked `"published"` only when all of the
following hold:

1. `id`, `slug`, `category`, `name` and `description` are non-empty strings
2. `price.amount` is a non-negative integer and `price.currency` is recognized
3. `inventory` is a non-negative integer equal to the sum of variant inventories
4. `publicationStatus` is `"published"`
5. At least one variant exists
6. Every variant has a unique SKU, non-empty size and color, valid images,
   integer price adjustment and non-negative inventory
7. Final variant price (base + adjustment) must not be negative
8. `createdAt` and `updatedAt` are valid ISO 8601 timestamps

For cross-product safety, `canPublishInCatalog()` additionally rejects a
product if any of its IDs, slugs, variant IDs or variant SKUs collide with
an already-published product's corresponding values.

Records that fail any check are rejected by `validateProduct()` and cannot
pass `canPublish()`. Draft and unpublished records are never returned by
`getPublishedProducts()`.

## 8. Shopify versus custom backend

### Decision criteria

| Factor | Shopify | Custom PostgreSQL |
|---|---|---|
| Time to market | Faster (hosted, managed) | Slower (build and operate) |
| Data ownership | Platform constraints | Full control |
| Existing integrations | Payments, shipping, tax | Build or integrate each |
| Cost | Monthly fees + transaction | Hosting + development |
| Customization | Limited by platform | Unrestricted |

### Open questions (to be answered by the business)

- Which payment provider does Echo & Air intend to use (Stripe, Shopify Payments, PayPal, etc.)?
- Are there tax or shipping requirements that constrain the platform choice?
- Is there an existing ERP or inventory system that must integrate?
- What is the expected catalog size and update frequency?

### Integration plan

1. **Phase 5A (this phase):** Data model, validation, import template,
   data-access boundary, documentation
2. **Phase 5B:** Backend implementation (Shopify Admin API or PostgreSQL +
   API routes) behind the `CommerceStore` interface
3. **Phase 5C:** Storefront integration — commercial products rendered
   alongside or in place of demonstration products
4. **Phase 5D:** Pricing, inventory, checkout and payments

No backend is implemented in this phase. The `MemoryCommerceStore` is a
placeholder that returns an empty catalog.

## 9. What this phase does NOT do

- No real checkout or payments
- No invented prices, stock or product specifications
- No exposed API credentials
- No changes to working frontend components
- No Shopify or PostgreSQL backend implementation
