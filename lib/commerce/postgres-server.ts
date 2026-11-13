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
 */

import { PrismaClient } from "@prisma/client";
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
  prisma: PrismaClient,
): Promise<CommercialProduct[]> {
  const rows = await prisma.product.findMany({
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
 * PostgreSQL-backed commerce store.
 *
 * Implements `CommerceStore` over a PostgreSQL database via Prisma. All
 * published-product queries enforce catalog-wide validation (unique IDs,
 * slugs, variant IDs and SKUs) so invalid records never appear as
 * purchasable. Unpublished products are never returned by
 * `getProductBySlug`, `getProductById`, `searchProducts` or
 * `filterByCategory`.
 *
 * A Prisma client is injected through the constructor so that the store can
 * be reused across requests without disconnecting between them. When no
 * client is supplied, the store creates its own client bound to
 * `DATABASE_URL`; constructing it does not require a database to be
 * reachable, but every query will fail clearly if the database is absent.
 */
export class PostgresCommerceStore implements CommerceStore {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient ?? new PrismaClient();
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
    );
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
    const published = catalog.filter((product) =>
      canPublishInCatalog(product, catalog),
    );

    const needle = query.trim().toLowerCase();
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
    );
  }

  /** Filter published products by category. */
  async filterByCategory(
    category: string,
  ): Promise<readonly CommercialProduct[]> {
    const catalog = await loadCatalog(this.prisma);
    if (category === "all") return this.getPublishedProducts();
    return catalog.filter(
      (product) =>
        canPublishInCatalog(product, catalog) &&
        product.category === category,
    );
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
