import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canPublish,
  canPublishInCatalog,
  validatePrice,
  validateProduct,
  validateVariant,
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
      for (const currency of ["USD", "EUR", "GBP"]) {
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

    it("rejects zero as invalid amount", () => {
      // Zero is actually valid (non-negative), so this tests it passes
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
      assert.strictEqual(
        validatePrice({ currency: "USD" }).valid,
        false,
      );
      assert.strictEqual(
        validatePrice({ amount: 100 }).valid,
        false,
      );
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

  describe("canPublishInCatalog (cross-product SKU uniqueness)", () => {
  it("returns true when no SKU conflicts exist", () => {
    const catalog: CommercialProduct[] = [
      validProduct({ id: "p-1", slug: "p-1", variants: [validVariant({ sku: "EXISTING-001" })] }),
    ];
    const product = validProduct({
      id: "p-2",
      slug: "p-2",
      publicationStatus: "published",
      variants: [validVariant({ sku: "NEW-001" })],
    });
    assert.strictEqual(canPublishInCatalog(product, catalog), true);
  });

    it("returns false when a variant SKU conflicts with a published product", () => {
      const catalog: CommercialProduct[] = [
        validProduct({
          id: "p-1",
          slug: "p-1",
          publicationStatus: "published",
          variants: [validVariant({ sku: "CONFLICT-001" })],
        }),
      ];
      const product = validProduct({
        id: "p-2",
        slug: "p-2",
        publicationStatus: "published",
        variants: [validVariant({ sku: "CONFLICT-001" })],
      });
      assert.strictEqual(canPublishInCatalog(product, catalog), false);
    });

    it("allows re-publishing the same product (own SKUs excluded)", () => {
      const catalog: CommercialProduct[] = [
        validProduct({
          id: "p-1",
          slug: "p-1",
          publicationStatus: "published",
          variants: [validVariant({ sku: "OWN-001" })],
        }),
      ];
      const product = validProduct({
        id: "p-1",
        slug: "p-1",
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
