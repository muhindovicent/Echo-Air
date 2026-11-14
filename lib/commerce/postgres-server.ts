/**
 * Server-only PostgreSQL-backed implementation of the `CommerceStore`
 * interface.
 *
 * This module is server-only: it imports `@prisma/client` and must never be
 * imported from a Client Component. It is used exclusively by the read-only
 * API routes under `app/api/products/`.
 *
 * The commercial catalog starts empty. Records are populated through a
 * verified import template (see `data/import-template.csv`) and validated
 * before publication. Incomplete or unverified records can never appear as
 * purchasable.
 *
 * No database credentials are stored here. Connection is configured through
 * the `DATABASE_URL` environment variable.
 *
 * A single shared Prisma Client is used across requests (see
 * `lib/commerce/prisma-client.ts`). The store accepts an optional injected
 * client (for tests) and falls back to the shared singleton otherwise. The
 * client is never disconnected per request.
 */

import { PrismaClient } from "@prisma/client";
import { prisma } from "./prisma-client.ts";
import type {
  CommercialProduct,
  CurrencyCode,
  Price,
  ProductVariant,
} from "./types.ts";
import type { CommerceStore } from "./store.ts";
import {
  canPublish,
  canPublishInCatalog,
  validateCatalog,
  validatePrice,
} from "./validation.ts";
import { CURRENCIES } from "./validation.ts";

/** Map a Prisma publication-status enum value to the commerce union type. */
function toPublicationStatus(
  value: string,
): CommercialProduct["publicationStatus"] {
  switch (value) {
    case "PUBLISHED":
      return "published";
    case "DRAFT":
      return "draft";
    case "UNPUBLISHED":
      return "unpublished";
    default:
      throw new Error(`Unknown publication status: ${value}`);
  }
}

/** Map a Prisma `ProductImage` to a variant image source string. */
function toImageSource(image: { url: string }): string {
  return image.url;
}

/**
 * Shape of a Prisma `Product` row with variants and images, as returned by
 * `findMany` with includes. Used as the input type for the mapper.
 */
type ProductRow = {
  id: string;
  slug: string;
  category: string;
  name: string;
  description: string;
  basePriceAmount: number;
  basePriceCurrency: string;
  publicationStatus: string;
  createdAt: Date;
  updatedAt: Date;
  variants: Array<{
    id: string;
    sku: string;
    size: string;
    color: string;
    priceAdjustment: number;
    inventory: number;
    images: { url: string }[];
  }>;
  images: { url: string }[];
};

/**
 * Map a Prisma `Product` with its relations to a `CommercialProduct`.
 *
 * Variant inventory is the authoritative source of truth: product-level
 * inventory is derived as the sum of all variant inventories.
 */
function mapProductToCommercialProduct(
  product: ProductRow,
): CommercialProduct {
  const variants: ProductVariant[] = product.variants.map((variant) => ({
    id: variant.id,
    sku: variant.sku,
    size: variant.size,
    color: variant.color,
    images: variant.images.map(toImageSource),
    priceAdjustment: variant.priceAdjustment,
    inventory: variant.inventory,
  }));

  const price: Price = {
    amount: product.basePriceAmount,
    currency: product.basePriceCurrency as CurrencyCode,
  };

  // Product inventory is derived from variant inventory (source of truth).
  const inventory = variants.reduce(
    (total, variant) => total + variant.inventory,
    0,
  );

  return {
    id: product.id,
    slug: product.slug,
    category: product.category,
    name: product.name,
    description: product.description,
    price,
    inventory,
    publicationStatus: toPublicationStatus(product.publicationStatus),
    variants,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

/**
 * Load every commercial product with its variants and images from the
 * database, mapped to `CommercialProduct` records.
 */
async function loadCatalog(
  prismaClient: PrismaClient,
): Promise<CommercialProduct[]> {
  const rows = await prismaClient.product.findMany({
    include: {
      variants: {
        include: {
          images: true,
        },
      },
      images: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return (rows as unknown as ProductRow[]).map(mapProductToCommercialProduct);
}

/**
 * Filter catalog entries by category, returning only publishable products.
 */
function filterByCategoryFromCatalog(
  catalog: readonly CommercialProduct[],
  category: string,
): CommercialProduct[] {
  if (category === "all") {
    return catalog as CommercialProduct[];
  }
  return catalog.filter(
    (product) =>
      canPublishInCatalog(product, catalog) && product.category === category,
  ) as CommercialProduct[];
}

/**
 * Filter catalog entries by a search query, returning only publishable
 * products. Works independently of category filtering.
 */
function filterByQueryFromCatalog(
  catalog: readonly CommercialProduct[],
  query: string,
): CommercialProduct[] {
  const needle = query.trim().toLowerCase();
  const published = catalog.filter((product) =>
    canPublishInCatalog(product, catalog),
  ) as CommercialProduct[];
  if (!needle) return published;

  return published.filter(
    (product) =>
      [
        product.name,
        product.category,
        product.description,
        product.slug,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle),
  ) as CommercialProduct[];
}

/**
 * Apply both category and query filters together, returning only publishable
 * products. Both filters must match.
 */
function filterByCategoryAndQueryFromCatalog(
  catalog: readonly CommercialProduct[],
  category: string,
  query: string,
): CommercialProduct[] {
  const published = catalog.filter((product) =>
    canPublishInCatalog(product, catalog),
  ) as CommercialProduct[];

  let filtered = published;
  if (category && category !== "all") {
    filtered = filtered.filter(
      (product) => product.category === category,
    );
  }
  if (query && query.trim()) {
    filtered = filterByQueryFromCatalog(filtered, query);
  }
  return filtered;
}

/**
 * PostgreSQL-backed commerce store.
 *
 * Implements `CommerceStore` over a PostgreSQL database via Prisma. All
 * published-product queries enforce catalog-wide validation (unique IDs,
 * slugs, variant IDs and SKUs) so invalid records never appear as
 * purchasable. Unpublished products are never returned by
 * `getProductBySlug`, `getProductById`, `searchProducts` or
 * `filterByCategory`.
 *
 * A Prisma client is injected through the constructor so that tests can use
 * an explicitly configured, isolated test database. When no client is
 * supplied, the store uses the shared server-side singleton. The client is
 * never disconnected per request.
 */
export class PostgresCommerceStore implements CommerceStore {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? prisma;
  }

  /** All commercial products in the catalog (unfiltered). */
  async getAllProducts(): Promise<readonly CommercialProduct[]> {
    return loadCatalog(this.prisma);
  }

  /** Products cleared for purchase (validated and published, catalog-safe). */
  async getPublishedProducts(): Promise<readonly CommercialProduct[]> {
    const catalog = await loadCatalog(this.prisma);
    return catalog.filter((product) =>
      canPublishInCatalog(product, catalog),
    ) as CommercialProduct[];
  }

  /** A product by its stable slug. Unpublished products return `undefined`. */
  async getProductBySlug(
    slug: string,
  ): Promise<CommercialProduct | undefined> {
    const catalog = await loadCatalog(this.prisma);
    const product = catalog.find((item) => item.slug === slug);
    if (!product || !canPublish(product)) return undefined;
    return product;
  }

  /** A product by its stable id. Unpublished products return `undefined`. */
  async getProductById(id: string): Promise<CommercialProduct | undefined> {
    const catalog = await loadCatalog(this.prisma);
    const product = catalog.find((item) => item.id === id);
    if (!product || !canPublish(product)) return undefined;
    return product;
  }

  /** Search published products by name, category, description or slug. */
  async searchProducts(query: string): Promise<readonly CommercialProduct[]> {
    const catalog = await loadCatalog(this.prisma);
    return filterByQueryFromCatalog(catalog, query);
  }

  /** Filter published products by category. */
  async filterByCategory(
    category: string,
  ): Promise<readonly CommercialProduct[]> {
    const catalog = await loadCatalog(this.prisma);
    return filterByCategoryFromCatalog(catalog, category);
  }

  /** Search and filter published products by query and category together.
   *
   * Both filters must match. Returns only publishable products.
   */
  async searchAndFilter(
    category: string,
    query: string,
  ): Promise<readonly CommercialProduct[]> {
    const catalog = await loadCatalog(this.prisma);
    return filterByCategoryAndQueryFromCatalog(catalog, category, query);
  }

  /** Validate the entire catalog for catalog-wide uniqueness and validity. */
  async validateCatalog(): Promise<{ valid: boolean; errors: string[] }> {
    const catalog = await loadCatalog(this.prisma);
    return validateCatalog(catalog);
  }
}

/**
 * Validate a `Price` object against the recognized currencies.
 *
 * Kept here for reuse by API routes that may construct prices from request
 * bodies.
 */
export function isValidPriceInput(price: unknown): price is Price {
  return validatePrice(price).valid;
}

/** The recognized currency codes, re-exported for consumers. */
export { CURRENCIES };
