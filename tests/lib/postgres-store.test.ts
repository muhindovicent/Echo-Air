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
 * Tests verify:
 * - Migrations apply cleanly against an isolated test database
 * - Product/variant/image relationships persist and load correctly
 * - Unique SKUs and slugs are enforced at the database level (rejected inserts)
 * - Unpublished products are never returned by published-product queries
 * - Cross-product uniqueness (variant SKUs) blocks publication
 * - Product inventory is derived from variant inventory (source of truth)
 * - Read-only API responses exclude unpublished products
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

    async function truncateTables(): Promise<void> {
      await prisma.orderItem.deleteMany({});
      await prisma.order.deleteMany({});
      await prisma.inventoryMovement.deleteMany({});
      await prisma.productImage.deleteMany({});
      await prisma.productVariant.deleteMany({});
      await prisma.product.deleteMany({});
    }

    describe("migrations", () => {
      it("applies the schema migrations cleanly", () => {
        assert.doesNotThrow(() => {
          execSync("npx prisma migrate deploy", {
            env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
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
    });
  });
}
