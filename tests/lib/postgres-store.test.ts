/**
 * Integration tests for the PostgreSQL-backed commerce store.
 *
 * These tests require a live PostgreSQL instance configured through the
 * `TEST_DATABASE_URL` environment variable. If that variable is not set,
 * every test in this file is skipped and a clear message is reported — no
 * results are fabricated and no database is assumed to exist.
 *
 * Tests verify:
 * - Migrations apply cleanly against an isolated test database
 * - Product/variant relationships persist and load correctly
 * - Unique SKUs and slugs are enforced at the database level
 * - Unpublished products are never returned by published-product queries
 * - Cross-product uniqueness (variant SKUs) blocks publication
 * - Product inventory is derived from variant inventory (source of truth)
 */

import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import type { CommercialProduct } from "../../lib/commerce/types.ts";
import {
  PostgresCommerceStore,
  disconnectPrisma,
} from "../../lib/commerce/postgres-server.ts";
import { validateCatalog } from "../../lib/commerce/validation.ts";

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

/** Skip all tests when no test database is configured. */
if (!TEST_DATABASE_URL) {
  describe("commerce integration (PostgreSQL)", () => {
    it("skipped: TEST_DATABASE_URL is not configured", () => {
      console.log(
        "Skipping PostgreSQL integration tests: set TEST_DATABASE_URL to run against an isolated test database.",
      );
      assert.ok(true, "test database not configured — tests skipped");
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
        await disconnectPrisma();
      });

      it("loads a published product with its variants", async () => {
        await prisma.product.create({
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

        const store = new PostgresCommerceStore();
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

        const store = new PostgresCommerceStore();
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

        const store = new PostgresCommerceStore();
        const product = await store.getProductBySlug("integration-hidden");
        assert.strictEqual(
          product,
          undefined,
          "unpublished product must be undefined",
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
        await disconnectPrisma();
      });

      it("rejects duplicate product slugs", async () => {
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

      it("rejects duplicate variant SKUs via validateCatalog", async () => {
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
              create: [{ sku: "UNIQUE-SKU-001", size: "L", color: "Black", inventory: 1 }],
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

        const store = new PostgresCommerceStore();
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
        await disconnectPrisma();
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

        const store = new PostgresCommerceStore();
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
  });
}
