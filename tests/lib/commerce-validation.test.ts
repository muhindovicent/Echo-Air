import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canPublish,
  canPublishInCatalog,
  validatePrice,
  validateProduct,
  validateVariant,
  validateCatalog,
} from "../../lib/commerce/validation.ts";
import type { CommercialProduct, ProductVariant } from "../../lib/commerce/types.ts";

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
    inventory: 5,
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

    it("allows re-publishing the same product (own SKUs excluded)", () => {
      const catalog: CommercialProduct[] = [
        validProduct({
          id: "p-1",
          slug: "slug-1",
          publicationStatus: "published",
          variants: [validVariant({ sku: "OWN-001" })],
        }),
      ];
      const product = validProduct({
        id: "p-1",
        slug: "slug-1",
        publicationStatus: "published",
        variants: [validVariant({ sku: "OWN-001" })],
      });
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

    it("returns false when a product conflicts on product ID with a published product", () => {
      const catalog: CommercialProduct[] = [
        validProduct({
          id: "shared-id",
          slug: "slug-1",
          publicationStatus: "published",
          variants: [validVariant({ sku: "SKU-1" })],
        }),
        validProduct({
          id: "shared-id",
          slug: "slug-2",
          publicationStatus: "published",
          variants: [validVariant({ sku: "SKU-2" })],
        }),
      ];
      const result = validateCatalog(catalog);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Product id") && e.includes("not unique")));
    });

    it("returns false when a product conflicts on product slug with a published product", () => {
      const catalog: CommercialProduct[] = [
        validProduct({
          id: "p-1",
          slug: "shared-slug",
          publicationStatus: "published",
          variants: [validVariant({ sku: "SKU-1" })],
        }),
      ];
      const product = validProduct({
        id: "p-2",
        slug: "shared-slug",
        publicationStatus: "published",
        variants: [validVariant({ sku: "SKU-2" })],
      });
      assert.strictEqual(canPublishInCatalog(product, catalog), false);
    });

    it("returns false when a product conflicts on variant ID with a published product", () => {
      const catalog: CommercialProduct[] = [
        validProduct({
          id: "p-1",
          slug: "slug-1",
          publicationStatus: "published",
          variants: [validVariant({ id: "shared-vid", sku: "SKU-1" })],
        }),
      ];
      const product = validProduct({
        id: "p-2",
        slug: "slug-2",
        publicationStatus: "published",
        variants: [validVariant({ id: "shared-vid", sku: "SKU-2" })],
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
  });

  describe("catalog-wide uniqueness (regression)", () => {
    it("rejects duplicate product IDs across the catalog", () => {
      const result = validateCatalog([
        validProduct({ id: "DUP-ID", slug: "slug-1" }),
        validProduct({ id: "DUP-ID", slug: "slug-2" }),
      ]);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Product id") && e.includes("not unique")));
    });

    it("rejects duplicate product slugs across the catalog", () => {
      const result = validateCatalog([
        validProduct({ id: "p-1", slug: "DUP-SLUG" }),
        validProduct({ id: "p-2", slug: "DUP-SLUG" }),
      ]);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Product slug") && e.includes("not unique")));
    });

    it("rejects duplicate variant IDs across the catalog", () => {
      const result = validateCatalog([
        validProduct({
          id: "p-1",
          slug: "slug-1",
          variants: [validVariant({ id: "DUP-VID" })],
        }),
        validProduct({
          id: "p-2",
          slug: "slug-2",
          variants: [validVariant({ id: "DUP-VID" })],
        }),
      ]);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Variant id") && e.includes("not unique")));
    });

    it("rejects duplicate variant SKUs across the catalog", () => {
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

  describe("null and malformed variant safety (regression)", () => {
    it("rejects a null variant in a product", () => {
      const result = validateProduct(validProduct({
        variants: [null as unknown as ProductVariant],
      }));
      assert.strictEqual(result.valid, false);
    });

    it("rejects a non-object variant in a product", () => {
      const result = validateProduct(validProduct({
        variants: ["not-a-variant" as unknown as ProductVariant],
      }));
      assert.strictEqual(result.valid, false);
    });

    it("rejects empty variant images array", () => {
      const result = validateProduct(validProduct({
        variants: [validVariant({ images: [] })],
      }));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("images")));
    });

    it("rejects variant images containing empty strings", () => {
      const result = validateProduct(validProduct({
        variants: [validVariant({ images: ["", "/concept/piece.jpg"] })],
      }));
      assert.strictEqual(result.valid, false);
    });

    it("rejects a variant with null id", () => {
      const result = validateVariant(null);
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("Variant must be an object")));
    });
  });

  describe("ISO timestamp validation (regression)", () => {
    it("rejects empty createdAt", () => {
      assert.strictEqual(validateProduct(validProduct({ createdAt: "" })).valid, false);
    });

    it("rejects non-ISO createdAt", () => {
      assert.strictEqual(
        validateProduct(validProduct({ createdAt: "not-a-timestamp" })).valid,
        false,
      );
    });

    it("rejects date-only createdAt (missing time)", () => {
      assert.strictEqual(
        validateProduct(validProduct({ createdAt: "2026-01-01" })).valid,
        false,
      );
    });

    it("accepts valid ISO 8601 timestamps with timezone offset", () => {
      assert.strictEqual(
        validateProduct(validProduct({ createdAt: "2026-01-01T00:00:00+03:00" })).valid,
        true,
      );
    });

    it("accepts valid ISO 8601 timestamps with fractional seconds", () => {
      assert.strictEqual(
        validateProduct(validProduct({ createdAt: "2026-01-01T00:00:00.123Z" })).valid,
        true,
      );
    });

    it("rejects empty updatedAt", () => {
      assert.strictEqual(validateProduct(validProduct({ updatedAt: "" })).valid, false);
    });
  });

  describe("negative final variant price (regression)", () => {
    it("rejects a variant whose final price is negative", () => {
      const result = validateProduct(validProduct({
        price: { amount: 100, currency: "USD" },
        variants: [validVariant({ priceAdjustment: -200 })],
      }));
      assert.strictEqual(result.valid, false);
      assert.ok(result.errors.some((e) => e.includes("negative final price")));
    });

    it("accepts a variant whose final price is zero", () => {
      const result = validateProduct(validProduct({
        price: { amount: 100, currency: "USD" },
        variants: [validVariant({ priceAdjustment: -100 })],
      }));
      assert.strictEqual(result.valid, true);
    });

    it("accepts a variant whose final price is positive", () => {
      const result = validateProduct(validProduct({
        price: { amount: 100, currency: "USD" },
        variants: [validVariant({ priceAdjustment: 50 })],
      }));
      assert.strictEqual(result.valid, true);
    });
  });

  describe("consistent inventory rule (regression)", () => {
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

    it("rejects non-integer product inventory", () => {
      const result = validateProduct(validProduct({ inventory: 2.5 }));
      assert.strictEqual(result.valid, false);
    });

    it("rejects non-integer variant inventory", () => {
      const result = validateProduct(validProduct({
        variants: [validVariant({ inventory: 2.5 })],
      }));
      assert.strictEqual(result.valid, false);
    });

    it("accepts zero product inventory", () => {
      const result = validateProduct(validProduct({ inventory: 0 }));
      assert.strictEqual(result.valid, true);
    });

    it("accepts zero variant inventory", () => {
      const result = validateProduct(validProduct({
        variants: [validVariant({ inventory: 0 })],
      }));
      assert.strictEqual(result.valid, true);
    });
  });

  describe("UGX currency support (regression)", () => {
    it("accepts UGX as a valid currency", () => {
      const result = validatePrice({ amount: 300000, currency: "UGX" });
      assert.strictEqual(result.valid, true);
    });

    it("accepts a product priced in UGX", () => {
      const result = validateProduct(validProduct({
        price: { amount: 300000, currency: "UGX" },
      }));
      assert.strictEqual(result.valid, true);
    });

    it("rejects unknown currencies even with UGX supported", () => {
      const result = validatePrice({ amount: 100, currency: "XYZ" });
      assert.strictEqual(result.valid, false);
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
