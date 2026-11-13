/**
 * Commerce product model for Echo & Air.
 *
 * This is the strongly typed model for real commercial records. It is
 * deliberately separate from the demonstration catalogue in lib/products.ts,
 * which carries only concept placeholders (isConcept: true,
 * availability: "not-for-sale") and no commercial information.
 *
 * Commercial records describe actual merchandise that may be published for
 * sale. No prices, inventory or product specifications are fabricated here —
 * the catalog starts empty and is populated from a verified import template.
 */

export type CurrencyCode = "USD" | "EUR" | "GBP";

/** A price in the smallest currency unit (e.g. cents for USD). */
export type Price = {
  /** Minor currency units, e.g. 85000 for $850.00 USD. Must be a non-negative integer. */
  amount: number;
  currency: CurrencyCode;
};

/** Publication status controls whether a product can be purchased. */
export type PublicationStatus = "draft" | "published" | "unpublished";

/** A product variant with its own SKU, size, color, images and inventory. */
export type ProductVariant = {
  /** Stable variant identifier. */
  id: string;
  /** Stock-keeping unit, unique across the entire catalog. */
  sku: string;
  /** Size label, e.g. "S", "M", "L" or "40", "41", "42". */
  size: string;
  /** Color label, e.g. "Black", "Bone", "Graphite". */
  color: string;
  /** Variant-specific image sources, in display order. */
  images: readonly string[];
  /** Price adjustment in minor currency units (0 means the base price). */
  priceAdjustment: number;
  /** Available inventory quantity, a non-negative integer. */
  inventory: number;
};

/** A commercial product record. */
export type CommercialProduct = {
  /** Stable product identifier. */
  id: string;
  /** Stable identifier used in routes, e.g. "longform-overcoat". */
  slug: string;
  /** Product category slug. */
  category: string;
  /** Product name. */
  name: string;
  /** Product description. */
  description: string;
  /** Base price, verified before publication. */
  price: Price;
  /** Total available inventory across all variants. */
  inventory: number;
  /** Whether the product can be purchased. */
  publicationStatus: PublicationStatus;
  /** Variants of this product. */
  variants: readonly ProductVariant[];
  /** ISO 8601 timestamp when the record was created. */
  createdAt: string;
  /** ISO 8601 timestamp when the record was last updated. */
  updatedAt: string;
};

/** A commercial product that is cleared for purchase. */
export type PublishableProduct = CommercialProduct & {
  publicationStatus: "published";
};

/** Result of validating a product or variant record. */
export type ValidationResult = {
  valid: boolean;
  errors: string[];
};
