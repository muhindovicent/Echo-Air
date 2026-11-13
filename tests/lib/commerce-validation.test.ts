import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canPublish,
  canPublishInCatalog,
  deriveProductInventory,
  validatePrice,
  validateProduct,
  validateVariant,
  validateCatalog,
} from "../../lib/commerce/validation.ts";
import type { CommercialProduct, ProductVariant } from "../../lib/commerce/types.ts";
import { MemoryCommerceStore } from "../../lib/commerce/store.ts";

const baseTime = "2026-01-01T00:00:00Z";

function validVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  return {
    id: "variant-01",
    sku: "SKU-001",
    size: "M",
    color: "Black",
    images: ["/concept/piece-outerwear.jpg"],
    priceAdjustment: 0,
    inventory: 10,
    ...overrides,
  };
}

function validProduct(overrides: Partial<CommercialProduct> = {}): CommercialProduct {
  return {
    id: "product-01",
    slug: "longform-overcoat",
    category: "outerwear",
    name: "Longform Overcoat",
    description: "A concept overcoat.",
    price: { amount: 85000, currency: "USD" },
    inventory: 10,
    publicationStatus: "draft",
    variants: [validVariant()],
    createdAt: baseTime,
    updatedAt: baseTime,
    ...overrides,
  };
}

describe("commerce validation", () => {
  describe("validatePrice", () => {
    it("accepts a valid price", () => {
      const result = validatePrice({ amount: 85000, currency: "USD" });
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("accepts all recognized currencies", () => {
      for (const currency of ["USD", "EUR", "GBP", "UGX"]) {
        const result = validatePrice({ amount: 100, currency });
        assert.strictEqual(result.valid, true, `Expected ${currency} to be valid`);
      }
    });

    it("rejects a negative amount", () => {
      const result = validatePrice({ amount: -100, currency: "USD" });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("amount")));
    });

    it("rejects a non-integer amount", () => {
      const result = validatePrice({ amount: 8500.5, currency: "USD" });
      assert.strictEqual(result.valid, false);
    });

    it("accepts zero amount", () => {
      const result = validatePrice({ amount: 0, currency: "USD" });
      assert.strictEqual(result.valid, true);
    });

    it("rejects an unknown currency", () => {
      const result = validatePrice({ amount: 85000, currency: "XYZ" });
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("currency")));
    });

    it("rejects a non-object price", () => {
      assert.strictEqual(validatePrice(null).valid, false);
      assert.strictEqual(validatePrice("85000").valid, false);
      assert.strictEqual(validatePrice(undefined).valid, false);
      assert.strictEqual(validatePrice([85000]).valid, false);
    });

    it("rejects a price missing amount or currency", () => {
      assert.strictEqual(validatePrice({ currency: "USD" }).valid, false);
      assert.strictEqual(validatePrice({ amount: 100 }).valid, false);
    });
  });

  describe("validateVariant", () => {
    it("accepts a valid variant", () => {
      const result = validateVariant(validVariant());
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("rejects a duplicate SKU", () => {
      const first = validateVariant(validVariant({ sku: "DUP-001" }));
      assert.strictEqual(first.valid, true);
      const second = validateVariant(validVariant({ sku: "DUP-001" }), ["DUP-001"]);
      assert.strictEqual(second.valid, false);
      assert.ok(second.errors.some((e) => e.includes("unique")));
    });

    it("rejects a missing SKU", () => {
      const result = validateVariant(validVariant({ sku: "" }));
      assert.strictEqual(result.valid, false);
    });

    it("rejects a SKU with whitespace", () => {
      const result = validateVariant(validVariant({ sku: "SKU 001" }));
      assert.strictEqual(result.valid, false);
    });

    it("rejects missing size or color", () => {
      assert.strictEqual(validateVariant(validVariant({ size: "" })).valid, false);
      assert.strictEqual(validateVariant(validVariant({ color: "" })).valid, false);
    });

    it("rejects a negative inventory", () => {
      const result = validateVariant(validVariant({ inventory: -1 }));
      assert.strictEqual(result.valid, false);
    });

    it("rejects non-integer inventory", () => {
      const result = validateVariant(validVariant({ inventory: 2.5 }));
      assert.strictEqual(result.valid, false);
    });

    it("rejects invalid images", () => {
      const result = validateVariant({ ...validVariant(), images: [""] });
      assert.strictEqual(result.valid, false);
    });

    it("rejects a non-object variant", () => {
      assert.strictEqual(validateVariant(null).valid, false);
      assert.strictEqual(validateVariant("variant").valid, false);
      assert.strictEqual(validateVariant(undefined).valid, false);
    });
  });

  describe("validateProduct", () => {
    it("accepts a valid product", () => {
      const result = validateProduct(validProduct());
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    it("rejects missing required fields", () => {
      for (const field of ["id", "slug", "category", "name", "description"]) {
        const result = validateProduct({ ...validProduct(), [field]: "" });
        assert.strictEqual(result.valid, false, `Expected ${field} to be required`);
      }
    });

    it("rejects an invalid price", () => {
      const result = validateProduct(validProduct({ price: { amount: -100, currency: "USD" } }));
      assert.strictEqual(result.valid, false);
    });

    it("rejects a negative inventory", () => {
      const result = validateProduct(validProduct({ inventory: -1 }));
      assert.strictEqual(result.valid, false);
    });

    it("rejects an invalid publication status", () => {
      const result = validateProduct(validProduct({ publicationStatus: "coming-soon" as CommercialProduct["publicationStatus"] }));
      assert.strictEqual(result.valid, false);
    });

    it("rejects products with no variants", () => {
      const result = validateProduct(validProduct({ variants: [] }));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("variant")));
    });

    it("rejects missing timestamps", () => {
      assert.strictEqual(validateProduct(validProduct({ createdAt: "" })).valid, false);
      assert.strictEqual(validateProduct(validProduct({ updatedAt: "" })).valid, false);
    });

    it("rejects non-object input", () => {
      assert.strictEqual(validateProduct(null).valid, false);
      assert.strictEqual(validateProduct(undefined).valid, false);
      assert.strictEqual(validateProduct("product").valid, false);
      assert.strictEqual(validateProduct([1, 2, 3]).valid, false);
    });

    it("reports duplicate variant SKUs within a product", () => {
      const result = validateProduct(validProduct({
        variants: [
          validVariant({ sku: "INT-DUP" }),
          validVariant({ sku: "INT-DUP" }),
        ],
      }));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("unique")));
    });
  });

  describe("canPublish", () => {
    it("returns true for a valid published product", () => {
      const product = validProduct({ publicationStatus: "published" });
      assert.strictEqual(canPublish(product), true);
    });

    it("returns false for a draft product", () => {
      const product = validProduct({ publicationStatus: "draft" });
      assert.strictEqual(canPublish(product), false);
    });

    it("returns false for an unpublished product", () => {
      const product = validProduct({ publicationStatus: "unpublished" });
      assert.strictEqual(canPublish(product), false);
    });

    it("returns false for a published product with invalid data", () => {
      const product = validProduct({
        publicationStatus: "published",
        price: { amount: -100, currency: "USD" },
      });
      assert.strictEqual(canPublish(product), false);
    });

    it("returns false for a published product with a duplicate variant SKU", () => {
      const product = validProduct({
        publicationStatus: "published",
        variants: [
          validVariant({ sku: "DUP-002" }),
          validVariant({ sku: "DUP-002" }),
        ],
      });
      assert.strictEqual(canPublish(product), false);
    });

    it("returns false for a published product missing required fields", () => {
      const product = validProduct({
        publicationStatus: "published",
        name: "",
      });
      assert.strictEqual(canPublish(product), false);
    });
  });

  describe("canPublishInCatalog cross-product conflicts (regression)", () => {
    it("returns true when no SKU conflicts exist", () => {
      const catalog: CommercialProduct[] = [
        validProduct({ id: "p-1", slug: "slug-1", variants: [validVariant({ sku: "EXISTING-001" })] }),
      ];
      const product = validProduct({
        id: "p-2",
        slug: "slug-2",
        publicationStatus: "published",
        variants: [validVariant({ sku: "NEW-001" })],
      });
      assert.strictEqual(canPublishInCatalog(product, catalog), true);
    });

    it("returns false when a variant SKU conflicts with a published product", () => {
      const catalog: CommercialProduct[] = [
        validProduct({
          id: "p-1",
          slug: "slug-1",
          publicationStatus: "published",
          variants: [validVariant({ sku: "CONFLICT-001" })],
        }),
      ];
      const product = validProduct({
        id: "p-2",
        slug: "slug-2",
        publicationStatus: "published",
        variants: [validVariant({ sku: "CONFLICT-001" })],
      });
      assert.strictEqual(canPublishInCatalog(product, catalog), false);
    });

    it("allows re-publishing the same product object (reference self-exclusion)", () => {
      const product = validProduct({
        id: "p-1",
        slug: "slug-1",
        publicationStatus: "published",
        variants: [validVariant({ sku: "OWN-001" })],
      });
      const catalog: CommercialProduct[] = [product];
      assert.strictEqual(canPublishInCatalog(product, catalog), true);
    });

    it("returns false when the product itself is invalid", () => {
      const catalog: CommercialProduct[] = [];
      const product = validProduct({
        publicationStatus: "published",
        price: { amount: -100, currency: "USD" },
      });
      assert.strictEqual(canPublishInCatalog(product, catalog), false);
    });

    it("returns false when multiple published products conflict on variant SKU", () => {
      const catalog: CommercialProduct[] = [
        validProduct({
          id: "p-1",
          slug: "slug-1",
          publicationStatus: "published",
          variants: [validVariant({ sku: "CONFLICT-SKU" })],
        }),
        validProduct({
          id: "p-2",
          slug: "slug-2",
          publicationStatus: "published",
          variants: [validVariant({ sku: "CONFLICT-SKU" })],
        }),
      ];
      assert.strictEqual(canPublishInCatalog(catalog[0], catalog), false);
      assert.strictEqual(canPublishInCatalog(catalog[1], catalog), false);
    });

    it("rejects a product whose ID conflicts with a different published product", () => {
      const catalog: CommercialProduct[] = [
        validProduct({
          id: "existing-id",
          slug: "slug-1",
          publicationStatus: "published",
          variants: [validVariant({ sku: "SKU-1" })],
        }),
      ];
      const product = validProduct({
        id: "existing-id",
        slug: "slug-2",
        publicationStatus: "published",
        variants: [validVariant({ sku: "SKU-2" })],
      });
      assert.strictEqual(canPublishInCatalog(product, catalog), false);
    });

    it("ignores unpublished products when checking cross-product conflicts", () => {
      const catalog: CommercialProduct[] = [
        validProduct({
          id: "p-1",
          slug: "slug-1",
          publicationStatus: "draft",
          variants: [validVariant({ sku: "DRAFT-SKU" })],
        }),
      ];
      const product = validProduct({
        id: "p-2",
        slug: "slug-2",
        publicationStatus: "published",
        variants: [validVariant({ sku: "DRAFT-SKU" })],
      });
      assert.strictEqual(canPublishInCatalog(product, catalog), true);
    });

    it("prevents different products sharing an ID from bypassing uniqueness", () => {
      const catalog: CommercialProduct[] = [
        validProduct({
          id: "SHARED-ID",
          slug: "slug-1",
          publicationStatus: "published",
          variants: [validVariant({ sku: "SKU-1" })],
        }),
        validProduct({
          id: "SHARED-ID",
          slug: "slug-2",
          publicationStatus: "published",
          variants: [validVariant({ sku: "SKU-2" })],
        }),
      ];
      assert.strictEqual(canPublishInCatalog(catalog[0], catalog), false);
      assert.strictEqual(canPublishInCatalog(catalog[1], catalog), false);
    });
  });

  describe("validateCatalog defensive safety (regression)", () => {
    it("does not throw on malformed product entries", () => {
      assert.doesNotThrow(() => {
        const result = validateCatalog([
          null as unknown as CommercialProduct,
          undefined as unknown as CommercialProduct,
          "not-a-product" as unknown as CommercialProduct,
        ]);
        assert.strictEqual(result.valid, false);
      });
    });

    it("does not throw on products with null variants", () => {
      assert.doesNotThrow(() => {
        const result = validateCatalog([
          validProduct({ variants: null as unknown as ProductVariant[] }),
          validProduct({ variants: undefined as unknown as ProductVariant[] }),
        ]);
        assert.strictEqual(result.valid, false);
      });
    });

    it("does not throw on products with null variant items", () => {
      assert.doesNotThrow(() => {
        const result = validateCatalog([
          validProduct({ variants: [null as unknown as ProductVariant] }),
          validProduct({ variants: ["not-a-variant" as unknown as ProductVariant] }),
        ]);
        assert.strictEqual(result.valid, false);
      });
    });

    it("rejects catalogs with duplicate product IDs across entries", () => {
      const result = validateCatalog([
        validProduct({ id: "DUP-ID", slug: "slug-1" }),
        validProduct({ id: "DUP-ID", slug: "slug-2" }),
      ]);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Product id") && e.includes("not unique")));
    });

    it("rejects catalogs with duplicate variant SKUs across entries", () => {
      const result = validateCatalog([
        validProduct({
          id: "p-1",
          slug: "slug-1",
          variants: [validVariant({ sku: "DUP-SKU" })],
        }),
        validProduct({
          id: "p-2",
          slug: "slug-2",
          variants: [validVariant({ sku: "DUP-SKU" })],
        }),
      ]);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Variant SKU") && e.includes("not unique")));
    });

    it("accepts a catalog with all unique IDs, slugs, variant IDs and SKUs", () => {
      const result = validateCatalog([
        validProduct({
          id: "p-1",
          slug: "slug-1",
          variants: [validVariant({ id: "vid-1", sku: "SKU-1" })],
        }),
        validProduct({
          id: "p-2",
          slug: "slug-2",
          variants: [validVariant({ id: "vid-2", sku: "SKU-2" })],
        }),
      ]);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });
  });

  describe("variant inventory as authoritative source (regression)", () => {
    it("rejects product inventory that does not equal sum of variant inventories", () => {
      const result = validateProduct(validProduct({
        inventory: 100,
        variants: [
          validVariant({ inventory: 30, sku: "SKU-A" }),
          validVariant({ inventory: 20, sku: "SKU-B" }),
        ],
      }));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("does not equal")));
    });

    it("accepts product inventory equal to sum of variant inventories", () => {
      const result = validateProduct(validProduct({
        inventory: 50,
        variants: [
          validVariant({ id: "v-a", inventory: 30, sku: "SKU-A" }),
          validVariant({ id: "v-b", inventory: 20, sku: "SKU-B" }),
        ],
      }));
      assert.strictEqual(result.valid, true);
    });

    it("derives product inventory from variant inventories", () => {
      const total = deriveProductInventory([
        validVariant({ inventory: 10 }),
        validVariant({ inventory: 20 }),
        validVariant({ inventory: 30 }),
      ]);
      assert.strictEqual(total, 60);
    });

    it("rejects negative product inventory", () => {
      const result = validateProduct(validProduct({ inventory: -1 }));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("inventory")));
    });

    it("rejects negative variant inventory", () => {
      const result = validateProduct(validProduct({
        variants: [validVariant({ inventory: -1 })],
      }));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("inventory")));
    });

    it("rejects non-integer variant inventory", () => {
      const result = validateProduct(validProduct({
        variants: [validVariant({ inventory: 2.5 })],
      }));
      assert.strictEqual(result.valid, false);
    });

    it("accepts zero inventory throughout", () => {
      const result = validateProduct(validProduct({
        inventory: 0,
        variants: [validVariant({ inventory: 0 })],
      }));
      assert.strictEqual(result.valid, true);
    });
  });

  describe("ISO timestamp actual value validation (regression)", () => {
    it("rejects format-valid but impossible dates", () => {
      assert.strictEqual(
        validateProduct(validProduct({ createdAt: "2026-13-45T99:99:99Z" })).valid,
        false,
      );
    });

    it("rejects month 13", () => {
      assert.strictEqual(
        validateProduct(validProduct({ createdAt: "2026-13-01T00:00:00Z" })).valid,
        false,
      );
    });

    it("rejects day 32", () => {
      assert.strictEqual(
        validateProduct(validProduct({ createdAt: "2026-01-32T00:00:00Z" })).valid,
        false,
      );
    });

    it("accepts valid leap year date", () => {
      assert.strictEqual(
        validateProduct(validProduct({ createdAt: "2024-02-29T00:00:00Z" })).valid,
        true,
      );
    });

    it("rejects non-leap year Feb 29", () => {
      assert.strictEqual(
        validateProduct(validProduct({ createdAt: "2023-02-29T00:00:00Z" })).valid,
        false,
      );
    });

    it("accepts valid ISO 8601 with timezone offset", () => {
      assert.strictEqual(
        validateProduct(validProduct({ createdAt: "2026-01-01T00:00:00+03:00" })).valid,
        true,
      );
    });

    it("rejects empty updatedAt", () => {
      assert.strictEqual(validateProduct(validProduct({ updatedAt: "" })).valid, false);
    });
  });

  describe("MemoryCommerceStore published-product queries (regression)", () => {
    it("getPublishedProducts returns only valid published products", async () => {
      const store = new MemoryCommerceStore([
        validProduct({
          id: "p-1",
          slug: "slug-1",
          publicationStatus: "published",
          variants: [validVariant({ id: "v-p1-1", sku: "SKU-P1-1" })],
        }),
        validProduct({
          id: "p-2",
          slug: "slug-2",
          publicationStatus: "draft",
          variants: [validVariant({ id: "v-p2-1", sku: "SKU-P2-1" })],
        }),
        validProduct({
          id: "p-3",
          slug: "slug-3",
          publicationStatus: "published",
          variants: [validVariant({ id: "v-p3-1", sku: "SKU-P3-1", inventory: -1 })], // invalid
        }),
        validProduct({
          id: "p-4",
          slug: "slug-4",
          publicationStatus: "published",
          variants: [validVariant({ id: "v-p4-1", sku: "SKU-P4-1" })],
        }),
      ]);

      const published = await store.getPublishedProducts();
      assert.strictEqual(published.length, 2);
      assert.ok(published.some((p) => p.slug === "slug-1"));
      assert.ok(published.some((p) => p.slug === "slug-4"));
      assert.ok(!published.some((p) => p.slug === "slug-2"));
      assert.ok(!published.some((p) => p.slug === "slug-3"));
    });

    it("getPublishedProducts excludes products with conflicting published IDs", async () => {
      const store = new MemoryCommerceStore([
        validProduct({
          id: "shared-id",
          slug: "slug-1",
          publicationStatus: "published",
          variants: [validVariant({ id: "v-s1", sku: "SKU-S1" })],
        }),
        validProduct({
          id: "shared-id",
          slug: "slug-2",
          publicationStatus: "published",
          variants: [validVariant({ id: "v-s2", sku: "SKU-S2" })],
        }),
      ]);

      const published = await store.getPublishedProducts();
      assert.strictEqual(published.length, 0);
    });

    it("searchProducts only returns published products", async () => {
      const store = new MemoryCommerceStore([
        validProduct({
          id: "p-1",
          slug: "slug-1",
          publicationStatus: "published",
          name: "Longform Overcoat",
          variants: [validVariant({ sku: "SKU-1" })],
        }),
        validProduct({
          id: "p-2",
          slug: "slug-2",
          publicationStatus: "draft",
          name: "Draft Piece",
          variants: [validVariant({ sku: "SKU-2" })],
        }),
      ]);

      const results = await store.searchProducts("overcoat");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].slug, "slug-1");
    });

    it("filterByCategory only returns published products", async () => {
      const store = new MemoryCommerceStore([
        validProduct({
          id: "p-1",
          slug: "slug-1",
          publicationStatus: "published",
          category: "outerwear",
          variants: [validVariant({ sku: "SKU-1" })],
        }),
        validProduct({
          id: "p-2",
          slug: "slug-2",
          publicationStatus: "draft",
          category: "outerwear",
          variants: [validVariant({ sku: "SKU-2" })],
        }),
      ]);

      const results = await store.filterByCategory("outerwear");
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].slug, "slug-1");
    });

    it("validateCatalog detects catalog-wide issues", async () => {
      const store = new MemoryCommerceStore([
        validProduct({ id: "p-1", slug: "slug-1" }),
        validProduct({ id: "p-1", slug: "slug-2" }), // duplicate ID
      ]);

      const result = await store.validateCatalog();
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Product id") && e.includes("not unique")));
    });

    it("returns empty for an empty catalog", async () => {
      const store = new MemoryCommerceStore([]);

      assert.deepStrictEqual(await store.getPublishedProducts(), []);
      assert.deepStrictEqual(await store.searchProducts("anything"), []);
      assert.deepStrictEqual(await store.filterByCategory("outerwear"), []);
      const validation = await store.validateCatalog();
      assert.strictEqual(validation.valid, true);
    });
  });

  describe("missing data and publication restrictions", () => {
    it("never treats a draft record as publishable", () => {
      const product = validProduct({ publicationStatus: "draft" });
      assert.strictEqual(canPublish(product), false);
    });

    it("never treats an unpublished record as publishable", () => {
      const product = validProduct({ publicationStatus: "unpublished" });
      assert.strictEqual(canPublish(product), false);
    });

    it("rejects a product missing its description", () => {
      const result = validateProduct(validProduct({ description: "" }));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("description")));
    });

    it("rejects a product missing its category", () => {
      const result = validateProduct(validProduct({ category: "" }));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("category")));
    });

    it("rejects invalid variants within a product", () => {
      const result = validateProduct(validProduct({
        variants: [validVariant({ inventory: -5 })],
      }));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("inventory")));
    });
  });
});
