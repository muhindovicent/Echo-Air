/**
 * Integration tests for the PostgreSQL-backed commerce store.
 *
 * These tests require a live PostgreSQL instance configured through the
 * `TEST_DATABASE_URL` environment variable. If that variable is not set,
 * every test in this file is skipped (not passed) and a clear message is
 * reported — no results are fabricated and no database is assumed to exist.
 *
 * The Prisma client is injected into the store through its constructor so
 * that tests use an explicitly configured, isolated test database and can
 * never accidentally access a production database.
 *
 * Both `DATABASE_URL` and `DIRECT_URL` are set to the test database during
 * migration tests so that schema changes never touch production.
 *
 * Tests verify:
 * - Migrations apply cleanly against an isolated test database
 * - Product/variant/image relationships persist and load correctly
 * - Unique SKUs and slugs are enforced at the database level (rejected inserts)
 * - Unpublished products are never returned by published-product queries
 * - Cross-product uniqueness (variant SKUs) blocks publication
 * - Product inventory is derived from variant inventory (source of truth)
 * - Read-only API responses exclude unpublished products
 * - Search and category filters work together
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import type { CommercialProduct } from "../../lib/commerce/types.ts";
import {
  PostgresCommerceStore,
} from "../../lib/commerce/postgres-server.ts";
import { validateCatalog } from "../../lib/commerce/validation.ts";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

/** Safety guard: reject any database URL that targets a production database.
 *
 * The test database name (the last path segment before any query string)
 * must contain "_test" to ensure we never accidentally target a production
 * database.
 */
function assertTestDatabase(url: string | undefined, name: string): void {
  if (!url) {
    throw new Error(`${name} is not set`);
  }
  // Extract the database name from the URL: the last path segment before ? or #
  const dbNameMatch = url.match(/\/([^/?#]+)(?:[?#]|$)/);
  const dbName = dbNameMatch ? dbNameMatch[1] : "";
  if (!dbName.includes("_test")) {
    throw new Error(
      `${name} does not target an isolated test database: ${url} ` +
        `(database name "${dbName}" does not contain "_test")`,
    );
  }
}

/** Skip all tests when no test database is configured. */
if (!TEST_DATABASE_URL) {
  describe("commerce integration (PostgreSQL)", () => {
    it.skip("skipped: TEST_DATABASE_URL is not configured", () => {
      // Tests cannot execute without an isolated test database.
      // Report as NOT RUN, not passed.
    });
  });
} else {
  describe("commerce integration (PostgreSQL)", () => {
    let prisma: PrismaClient;

    // Safety: both DATABASE_URL and DIRECT_URL must point to the test DB.
    assertTestDatabase(TEST_DATABASE_URL, "TEST_DATABASE_URL");

    async function truncateTables(): Promise<void> {
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
      await prisma.inventoryMovement.deleteMany({});
      await prisma.productImage.deleteMany({});
      await prisma.productVariant.deleteMany({});
      await prisma.product.deleteMany({});
    }

    describe("migrations", () => {
      it("applies the schema migrations cleanly against the test database", () => {
        // Both DATABASE_URL and DIRECT_URL target the isolated test database.
        assert.doesNotThrow(() => {
          execSync("npx prisma migrate deploy", {
            env: {
              ...process.env,
              DATABASE_URL: TEST_DATABASE_URL,
              DIRECT_URL: TEST_DATABASE_URL,
            },
            stdio: "pipe",
            timeout: 60000,
          });
        }, "migration deploy should succeed against the test database");
      });
    });

    describe("product and variant relationships", () => {
      beforeEach(async () => {
        prisma = new PrismaClient({
          datasources: { db: { url: TEST_DATABASE_URL } },
        });
        await prisma.$connect();
      });

      afterEach(async () => {
        await truncateTables();
        await prisma.$disconnect();
      });

      it("loads a published product with its variants and images", async () => {
        const product = await prisma.product.create({
          data: {
            slug: "integration-coat",
            category: "outerwear",
            name: "Integration Coat",
            description: "A test coat for integration testing.",
            basePriceAmount: 85000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: {
              create: [
                {
                  sku: "INT-COAT-M-BLK",
                  size: "M",
                  color: "Black",
                  priceAdjustment: 0,
                  inventory: 10,
                },
                {
                  sku: "INT-COAT-M-BRN",
                  size: "M",
                  color: "Brown",
                  priceAdjustment: 500,
                  inventory: 5,
                },
              ],
            },
          },
          include: {
            variants: true,
          },
        });

        // Add variant images after product creation.
        await prisma.productImage.create({
          data: {
            productId: product.id,
            variantId: product.variants[0].id,
            url: "/concept/piece-outerwear.jpg",
            alt: "Front",
          },
        });
        await prisma.productImage.create({
          data: {
            productId: product.id,
            variantId: product.variants[1].id,
            url: "/concept/piece-outerwear.jpg",
            alt: "Side",
          },
        });

        assert.strictEqual(product.slug, "integration-coat");
        assert.strictEqual(product.publicationStatus, "PUBLISHED");
        assert.strictEqual(product.variants.length, 2);

        const store = new PostgresCommerceStore(prisma);
        const published = await store.getPublishedProducts();
        assert.ok(
          published.some((p) => p.slug === "integration-coat"),
          "published product should be returned by getPublishedProducts",
        );
      });

      it("does not return unpublished products from getPublishedProducts", async () => {
        await prisma.product.create({
          data: {
            slug: "integration-unpublished",
            category: "outerwear",
            name: "Unpublished Coat",
            description: "Not yet for sale.",
            basePriceAmount: 50000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: {
              create: [{ sku: "INT-UNPUB-M-BLK", size: "M", color: "Black", inventory: 5 }],
            },
          },
        });

        const store = new PostgresCommerceStore(prisma);
        const published = await store.getPublishedProducts();
        assert.ok(
          !published.some((p) => p.slug === "integration-unpublished"),
          "unpublished product must not be returned",
        );
      });

      it("does not return unpublished products from getProductBySlug", async () => {
        await prisma.product.create({
          data: {
            slug: "integration-hidden",
            category: "outerwear",
            name: "Hidden Coat",
            description: "Not exposed.",
            basePriceAmount: 50000,
            basePriceCurrency: "USD",
            publicationStatus: "UNPUBLISHED",
            variants: {
              create: [{ sku: "INT-HIDDEN-M-BLK", size: "M", color: "Black", inventory: 5 }],
            },
          },
        });

        const store = new PostgresCommerceStore(prisma);
        const product = await store.getProductBySlug("integration-hidden");
        assert.strictEqual(
          product,
          undefined,
          "unpublished product must be undefined",
        );
      });

      it("maps PUBLISHED status to 'published' in commerce model", async () => {
        await prisma.product.create({
          data: {
            slug: "integration-published",
            category: "outerwear",
            name: "Published Coat",
            description: "Published test coat.",
            basePriceAmount: 85000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: {
              create: [{ sku: "INT-PUB-M-BLK", size: "M", color: "Black", inventory: 5 }],
            },
          },
        });

        const store = new PostgresCommerceStore(prisma);
        const product = await store.getProductBySlug("integration-published");
        assert.ok(product, "published product should be found");
        assert.strictEqual(
          product!.publicationStatus,
          "published",
          "PUBLISHED should map to 'published'",
        );
      });

      it("maps DRAFT status to 'draft' in commerce model", async () => {
        await prisma.product.create({
          data: {
            slug: "integration-draft",
            category: "outerwear",
            name: "Draft Coat",
            description: "Draft test coat.",
            basePriceAmount: 50000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: {
              create: [{ sku: "INT-DRAFT-M-BLK", size: "M", color: "Black", inventory: 5 }],
            },
          },
        });

        const store = new PostgresCommerceStore(prisma);
        const product = await store.getProductBySlug("integration-draft");
        assert.ok(product, "draft product should be found");
        assert.strictEqual(
          product!.publicationStatus,
          "draft",
          "DRAFT should map to 'draft'",
        );
      });
    });

    describe("catalog-wide uniqueness", () => {
      beforeEach(async () => {
        prisma = new PrismaClient({
          datasources: { db: { url: TEST_DATABASE_URL } },
        });
        await prisma.$connect();
      });

      afterEach(async () => {
        await truncateTables();
        await prisma.$disconnect();
      });

      it("rejects duplicate product slugs at the database level", async () => {
        await prisma.product.create({
          data: {
            slug: "dup-slug-product",
            category: "outerwear",
            name: "First",
            description: "First product.",
            basePriceAmount: 10000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: {
              create: [{ sku: "DUP-SLUG-1", size: "M", color: "Black", inventory: 1 }],
            },
          },
        });

        await assert.rejects(
          () =>
            prisma.product.create({
              data: {
                slug: "dup-slug-product",
                category: "outerwear",
                name: "Second",
                description: "Second product with same slug.",
                basePriceAmount: 10000,
                basePriceCurrency: "USD",
                publicationStatus: "DRAFT",
                variants: {
                  create: [{ sku: "DUP-SLUG-2", size: "M", color: "Black", inventory: 1 }],
                },
              },
            }),
          /Unique constraint/,
          "duplicate slug should violate the unique constraint",
        );
      });

      it("rejects duplicate variant SKUs at the database level", async () => {
        await prisma.product.create({
          data: {
            slug: "sku-dup-prod-1",
            category: "outerwear",
            name: "First Product",
            description: "First.",
            basePriceAmount: 10000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: {
              create: [{ sku: "UNIQUE-SKU-001", size: "M", color: "Black", inventory: 1 }],
            },
          },
        });

        await assert.rejects(
          () =>
            prisma.product.create({
              data: {
                slug: "sku-dup-prod-2",
                category: "outerwear",
                name: "Second Product",
                description: "Second.",
                basePriceAmount: 10000,
                basePriceCurrency: "USD",
                publicationStatus: "DRAFT",
                variants: {
                  create: [{ sku: "UNIQUE-SKU-001", size: "L", color: "Black", inventory: 1 }],
                },
              },
            }),
          /Unique constraint/,
          "duplicate variant SKU should violate the unique constraint",
        );
      });

      it("flags duplicate variant SKUs via validateCatalog", async () => {
        await prisma.product.create({
          data: {
            slug: "sku-dup-prod-1",
            category: "outerwear",
            name: "First Product",
            description: "First.",
            basePriceAmount: 10000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: {
              create: [{ sku: "UNIQUE-SKU-002", size: "M", color: "Black", inventory: 1 }],
            },
          },
        });
        await prisma.product.create({
          data: {
            slug: "sku-dup-prod-2",
            category: "outerwear",
            name: "Second Product",
            description: "Second.",
            basePriceAmount: 10000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: {
              create: [{ sku: "UNIQUE-SKU-002", size: "L", color: "Black", inventory: 1 }],
            },
          },
        });

        const rows = await prisma.product.findMany({
          include: { variants: true },
        });
        const result = await validateCatalog(
          rows as unknown as CommercialProduct[],
        );
        assert.strictEqual(result.valid, false);
        assert.ok(
          result.errors.some((e) => e.includes("Variant SKU") && e.includes("not unique")),
          "duplicate variant SKU should be flagged by validateCatalog",
        );
      });

      it("blocks publication when two published products share a variant SKU", async () => {
        await prisma.product.create({
          data: {
            slug: "conflict-prod-1",
            category: "outerwear",
            name: "Conflict One",
            description: "First.",
            basePriceAmount: 10000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: { create: [{ sku: "CONFLICT-SKU-99", size: "M", color: "Black", inventory: 1 }] },
          },
        });
        await prisma.product.create({
          data: {
            slug: "conflict-prod-2",
            category: "outerwear",
            name: "Conflict Two",
            description: "Second.",
            basePriceAmount: 10000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: { create: [{ sku: "CONFLICT-SKU-99", size: "L", color: "Black", inventory: 1 }] },
          },
        });

        const store = new PostgresCommerceStore(prisma);
        const published = await store.getPublishedProducts();
        // Both share variant SKU "CONFLICT-SKU-99", so neither can be published.
        assert.strictEqual(
          published.length,
          0,
          "products sharing a variant SKU must not both be publishable",
        );
      });
    });

    describe("inventory is derived from variants", () => {
      beforeEach(async () => {
        prisma = new PrismaClient({
          datasources: { db: { url: TEST_DATABASE_URL } },
        });
        await prisma.$connect();
      });

      afterEach(async () => {
        await truncateTables();
        await prisma.$disconnect();
      });

      it("product inventory equals the sum of variant inventories", async () => {
        await prisma.product.create({
          data: {
            slug: "inventory-prod",
            category: "outerwear",
            name: "Inventory Product",
            description: "Inventory test.",
            basePriceAmount: 10000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: {
              create: [
                { sku: "INV-VAR-1", size: "M", color: "Black", priceAdjustment: 0, inventory: 30 },
                { sku: "INV-VAR-2", size: "L", color: "Black", priceAdjustment: 0, inventory: 20 },
              ],
            },
          },
        });

        const store = new PostgresCommerceStore(prisma);
        const published = await store.getPublishedProducts();
        const product = published.find((p) => p.slug === "inventory-prod");
        assert.ok(product, "product should be published");
        assert.strictEqual(
          product!.inventory,
          50,
          "product inventory (50) should equal sum of variant inventories (30 + 20)",
        );
      });
    });

    describe("search and category filters", () => {
      beforeEach(async () => {
        prisma = new PrismaClient({
          datasources: { db: { url: TEST_DATABASE_URL } },
        });
        await prisma.$connect();
      });

      afterEach(async () => {
        await truncateTables();
        await prisma.$disconnect();
      });

      it("searchProducts returns only published products", async () => {
        await prisma.product.create({
          data: {
            slug: "search-published",
            category: "outerwear",
            name: "Published Searchable Coat",
            description: "Published.",
            basePriceAmount: 85000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: { create: [{ sku: "SEARCH-PUB-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });
        await prisma.product.create({
          data: {
            slug: "search-draft",
            category: "outerwear",
            name: "Draft Searchable Coat",
            description: "Draft.",
            basePriceAmount: 50000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: { create: [{ sku: "SEARCH-DRAFT-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });

        const store = new PostgresCommerceStore(prisma);
        const results = await store.searchProducts("coat");
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].slug, "search-published");
      });

      it("filterByCategory returns only published products", async () => {
        await prisma.product.create({
          data: {
            slug: "filter-published",
            category: "outerwear",
            name: "Published Category Coat",
            description: "Published.",
            basePriceAmount: 85000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: { create: [{ sku: "FILTER-PUB-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });
        await prisma.product.create({
          data: {
            slug: "filter-draft",
            category: "outerwear",
            name: "Draft Category Coat",
            description: "Draft.",
            basePriceAmount: 50000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: { create: [{ sku: "FILTER-DRAFT-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });

        const store = new PostgresCommerceStore(prisma);
        const results = await store.filterByCategory("outerwear");
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].slug, "filter-published");
      });

      it("searchAndFilter returns products matching both category and query", async () => {
        await prisma.product.create({
          data: {
            slug: "search-filter-published",
            category: "outerwear",
            name: "Published Searchable Coat",
            description: "Published outerwear.",
            basePriceAmount: 85000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: { create: [{ sku: "SF-PUB-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });
        await prisma.product.create({
          data: {
            slug: "search-filter-draft",
            category: "outerwear",
            name: "Draft Searchable Coat",
            description: "Draft outerwear.",
            basePriceAmount: 50000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: { create: [{ sku: "SF-DRAFT-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });
        await prisma.product.create({
          data: {
            slug: "search-filter-other-category",
            category: "trousers",
            name: "Published Trousers",
            description: "Published trousers.",
            basePriceAmount: 85000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: { create: [{ sku: "SF-TR-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });

        const store = new PostgresCommerceStore(prisma);

        // Category filter only: returns 1 published outerwear product.
        const byCategory = await store.filterByCategory("outerwear");
        assert.strictEqual(byCategory.length, 1);
        assert.strictEqual(byCategory[0].slug, "search-filter-published");

        // Query filter only: returns 1 published coat product.
        const byQuery = await store.searchProducts("coat");
        assert.strictEqual(byQuery.length, 1);
        assert.strictEqual(byQuery[0].slug, "search-filter-published");

        // Combined: category=outerwear AND query="coat" returns 1 product.
        const combined = await store.searchAndFilter("outerwear", "coat");
        assert.strictEqual(combined.length, 1);
        assert.strictEqual(combined[0].slug, "search-filter-published");

        // Combined: category=outerwear AND query="trousers" returns 0 products.
        const combinedEmpty = await store.searchAndFilter("outerwear", "trousers");
        assert.strictEqual(combinedEmpty.length, 0);
      });
    });

    describe("publication restrictions — drafts never appear as purchasable", () => {
      beforeEach(async () => {
        prisma = new PrismaClient({
          datasources: { db: { url: TEST_DATABASE_URL } },
        });
        await prisma.$connect();
      });

      afterEach(async () => {
        await truncateTables();
        await prisma.$disconnect();
      });

      it("empty search query returns only published products", async () => {
        await prisma.product.create({
          data: {
            slug: "empty-search-published",
            category: "outerwear",
            name: "Published Empty Search Coat",
            description: "Published.",
            basePriceAmount: 85000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: { create: [{ sku: "ES-PUB-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });
        await prisma.product.create({
          data: {
            slug: "empty-search-draft",
            category: "outerwear",
            name: "Draft Empty Search Coat",
            description: "Draft.",
            basePriceAmount: 50000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: { create: [{ sku: "ES-DRAFT-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });

        const store = new PostgresCommerceStore(prisma);

        // Empty query should return only published products.
        const results = await store.searchProducts("");
        assert.strictEqual(results.length, 1);
        assert.strictEqual(results[0].slug, "empty-search-published");
      });

      it("category 'all' returns only published products", async () => {
        await prisma.product.create({
          data: {
            slug: "cat-all-published",
            category: "outerwear",
            name: "Published Category All Coat",
            description: "Published.",
            basePriceAmount: 85000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: { create: [{ sku: "CA-PUB-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });
        await prisma.product.create({
          data: {
            slug: "cat-all-draft",
            category: "outerwear",
            name: "Draft Category All Coat",
            description: "Draft.",
            basePriceAmount: 50000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: { create: [{ sku: "CA-DRAFT-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });

        const store = new PostgresCommerceStore(prisma);

        // category="all" should return only published products.
        const allPublished = await store.filterByCategory("all");
        assert.strictEqual(allPublished.length, 1);
        assert.strictEqual(allPublished[0].slug, "cat-all-published");

        // category="outerwear" should also return only published.
        const byCategory = await store.filterByCategory("outerwear");
        assert.strictEqual(byCategory.length, 1);
        assert.strictEqual(byCategory[0].slug, "cat-all-published");
      });

      it("detail query (getProductBySlug) returns undefined for unpublished", async () => {
        await prisma.product.create({
          data: {
            slug: "detail-draft",
            category: "outerwear",
            name: "Draft Detail Coat",
            description: "Draft.",
            basePriceAmount: 50000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: { create: [{ sku: "DD-DRAFT-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });

        const store = new PostgresCommerceStore(prisma);
        const product = await store.getProductBySlug("detail-draft");
        assert.strictEqual(product, undefined, "unpublished product must not be returned by getProductBySlug");
      });

      it("draft products cannot leak through any published-product query", async () => {
        await prisma.product.create({
          data: {
            slug: "leak-published",
            category: "outerwear",
            name: "Published Leak Coat",
            description: "Published.",
            basePriceAmount: 85000,
            basePriceCurrency: "USD",
            publicationStatus: "PUBLISHED",
            variants: { create: [{ sku: "LEAK-PUB-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });
        await prisma.product.create({
          data: {
            slug: "leak-draft",
            category: "outerwear",
            name: "Draft Leak Coat",
            description: "Draft.",
            basePriceAmount: 50000,
            basePriceCurrency: "USD",
            publicationStatus: "DRAFT",
            variants: { create: [{ sku: "LEAK-DRAFT-M-BLK", size: "M", color: "Black", inventory: 5 }] },
          },
        });

        const store = new PostgresCommerceStore(prisma);

        // All publication queries must exclude drafts.
        const published = await store.getPublishedProducts();
        assert.strictEqual(published.length, 1);
        assert.strictEqual(published[0].slug, "leak-published");

        const searchResults = await store.searchProducts("coat");
        assert.strictEqual(searchResults.length, 1);
        assert.strictEqual(searchResults[0].slug, "leak-published");

        const categoryResults = await store.filterByCategory("outerwear");
        assert.strictEqual(categoryResults.length, 1);
        assert.strictEqual(categoryResults[0].slug, "leak-published");

        const combined = await store.searchAndFilter("outerwear", "coat");
        assert.strictEqual(combined.length, 1);
        assert.strictEqual(combined[0].slug, "leak-published");

        const detail = await store.getProductBySlug("leak-draft");
        assert.strictEqual(detail, undefined);
      });
    });
  });
}
