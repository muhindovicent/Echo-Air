/**
 * Data-access boundary for the Echo & Air commercial product catalog.
 *
 * This is the single seam between the storefront and product data. It is
 * intentionally small and has no backend implementation: the in-memory store
 * reads from a static catalog that starts empty. A later phase can swap in a
 * Shopify or custom PostgreSQL backend by implementing this same interface.
 *
 * No backend credentials, API keys or connection strings are stored here.
 */

import type { CommercialProduct } from "./types";
import { canPublishInCatalog, validateCatalog } from "./validation.ts";

/** Data-access boundary for the commercial product catalog. */
export interface CommerceStore {
  /** All commercial products in the catalog. */
  getAllProducts(): Promise<readonly CommercialProduct[]>;
  /** Products cleared for purchase (validated and published, catalog-safe). */
  getPublishedProducts(): Promise<readonly CommercialProduct[]>;
  /** A product by its stable slug. */
  getProductBySlug(slug: string): Promise<CommercialProduct | undefined>;
  /** A product by its stable id. */
  getProductById(id: string): Promise<CommercialProduct | undefined>;
  /** Search published products by name, category, description or slug. */
  searchProducts(query: string): Promise<readonly CommercialProduct[]>;
  /** Filter published products by category. */
  filterByCategory(category: string): Promise<readonly CommercialProduct[]>;
  /** Validate the entire catalog for catalog-wide uniqueness and validity. */
  validateCatalog(): Promise<{ valid: boolean; errors: string[] }>;
}

/** In-memory commerce store backed by a static catalog array. */
export class MemoryCommerceStore implements CommerceStore {
  private products: readonly CommercialProduct[];

  constructor(products: readonly CommercialProduct[] = []) {
    this.products = products;
  }

  async getAllProducts(): Promise<readonly CommercialProduct[]> {
    return this.products;
  }

  async getPublishedProducts(): Promise<readonly CommercialProduct[]> {
    return this.products.filter((product) =>
      canPublishInCatalog(product, this.products),
    );
  }

  async getProductBySlug(
    slug: string,
  ): Promise<CommercialProduct | undefined> {
    return this.products.find((product) => product.slug === slug);
  }

  async getProductById(id: string): Promise<CommercialProduct | undefined> {
    return this.products.find((product) => product.id === id);
  }

  async searchProducts(query: string): Promise<readonly CommercialProduct[]> {
    const needle = query.trim().toLowerCase();
    if (!needle) return this.getPublishedProducts();
    return this.products.filter(
      (product) =>
        canPublishInCatalog(product, this.products) &&
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

  async filterByCategory(
    category: string,
  ): Promise<readonly CommercialProduct[]> {
    if (category === "all") return this.getPublishedProducts();
    return this.products.filter(
      (product) =>
        canPublishInCatalog(product, this.products) &&
        product.category === category,
    );
  }

  async validateCatalog(): Promise<{ valid: boolean; errors: string[] }> {
    return validateCatalog(this.products);
  }
}

/** The commercial catalog loaded from the import template. Starts empty. */
export const commercialCatalog: readonly CommercialProduct[] = [];

/** Default store backed by the empty commercial catalog. */
export const commerceStore: CommerceStore = new MemoryCommerceStore(
  commercialCatalog,
);
