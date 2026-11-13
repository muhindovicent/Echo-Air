/**
 * Runtime validation for Echo & Air commerce records.
 *
 * All validation is pure: no side effects, no dependencies on the frontend
 * or on any backend. A record is valid only when every field is present,
 * correctly typed and consistent with the rest of the catalog (e.g. unique
 * SKUs across products). Invalid records can never be published.
 */

import type {
  CommercialProduct,
  CurrencyCode,
  ValidationResult,
} from "./types";

/** Recognized currency codes. */
export const CURRENCIES: readonly CurrencyCode[] = ["USD", "EUR", "GBP"];

/** A valid SKU is a non-empty string without whitespace. */
function isValidSku(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !/\s/.test(value);
}

/** A valid non-negative integer amount (minor currency units). */
function isValidNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value) &&
    value >= 0
  );
}

/** A valid integer amount (minor currency units), which may be negative. */
function isValidInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
}

/** A valid non-empty label (size, color, category, name, etc.). */
function isValidLabel(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** A valid non-empty image source string. */
function isValidImage(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

/** Type guard for a Price-shaped object. */
function isPriceShape(value: unknown): value is { amount: unknown; currency: unknown } {
  return typeof value === "object" && value !== null;
}

/** Validate a price record. */
export function validatePrice(price: unknown): ValidationResult {
  const errors: string[] = [];

  if (!isPriceShape(price)) {
    return { valid: false, errors: ["Price must be an object."] };
  }

  if (!isValidNonNegativeInteger(price.amount)) {
    errors.push("Price amount must be a non-negative integer (minor currency units).");
  }

  if (
    typeof price.currency !== "string" ||
    !CURRENCIES.includes(price.currency as CurrencyCode)
  ) {
    errors.push(`Price currency must be one of: ${CURRENCIES.join(", ")}.`);
  }

  return { valid: errors.length === 0, errors };
}

/** Validate a single variant. SKU uniqueness is checked against existing SKUs. */
export function validateVariant(
  variant: unknown,
  existingSkus: readonly string[] = [],
): ValidationResult {
  const errors: string[] = [];

  if (!variant || typeof variant !== "object") {
    return { valid: false, errors: ["Variant must be an object."] };
  }

  const v = variant as Record<string, unknown>;

  if (!isValidSku(v.id)) {
    errors.push("Variant id must be a non-empty string without whitespace.");
  }

  if (!isValidSku(v.sku)) {
    errors.push("Variant SKU must be a non-empty string without whitespace.");
  } else if (existingSkus.includes(v.sku)) {
    errors.push(`Variant SKU "${v.sku}" is not unique.`);
  }

  if (!isValidLabel(v.size)) {
    errors.push("Variant size must be a non-empty string.");
  }

  if (!isValidLabel(v.color)) {
    errors.push("Variant color must be a non-empty string.");
  }

  if (!Array.isArray(v.images) || v.images.some((img) => !isValidImage(img))) {
    errors.push("Variant images must be an array of non-empty strings.");
  }

  if (!isValidInteger(v.priceAdjustment)) {
    errors.push("Variant price adjustment must be an integer (minor currency units).");
  }

  if (!isValidNonNegativeInteger(v.inventory)) {
    errors.push("Variant inventory must be a non-negative integer.");
  }

  return { valid: errors.length === 0, errors };
}

/** Validate a full commercial product record. */
export function validateProduct(
  product: unknown,
  allSkus: readonly string[] = [],
): ValidationResult {
  const errors: string[] = [];

  if (!product || typeof product !== "object") {
    return { valid: false, errors: ["Product must be an object."] };
  }

  const p = product as Record<string, unknown>;

  if (!isValidSku(p.id)) {
    errors.push("Product id must be a non-empty string without whitespace.");
  }

  if (!isValidSku(p.slug)) {
    errors.push("Product slug must be a non-empty string without whitespace.");
  }

  if (!isValidLabel(p.category)) {
    errors.push("Product category must be a non-empty string.");
  }

  if (!isValidLabel(p.name)) {
    errors.push("Product name must be a non-empty string.");
  }

  if (!isValidLabel(p.description)) {
    errors.push("Product description must be a non-empty string.");
  }

  errors.push(...validatePrice(p.price).errors);

  if (!isValidNonNegativeInteger(p.inventory)) {
    errors.push("Product inventory must be a non-negative integer.");
  }

  if (
    typeof p.publicationStatus !== "string" ||
    !["draft", "published", "unpublished"].includes(p.publicationStatus)
  ) {
    errors.push('Product publicationStatus must be "draft", "published" or "unpublished".');
  }

  if (!Array.isArray(p.variants) || p.variants.length === 0) {
    errors.push("Product must have at least one variant.");
  } else {
    const variantSkus: string[] = [];
    for (const variant of p.variants) {
      errors.push(
        ...validateVariant(variant, [...allSkus, ...variantSkus]).errors,
      );
      if (isValidSku(variant.sku)) {
        variantSkus.push(variant.sku);
      }
    }
  }

  if (typeof p.createdAt !== "string" || p.createdAt.length === 0) {
    errors.push("Product createdAt must be a non-empty ISO 8601 string.");
  }

  if (typeof p.updatedAt !== "string" || p.updatedAt.length === 0) {
    errors.push("Product updatedAt must be a non-empty ISO 8601 string.");
  }

  return { valid: errors.length === 0, errors };
}

/** Check whether a product is complete and verified enough to publish. */
export function canPublish(product: CommercialProduct): boolean {
  if (product.publicationStatus !== "published") return false;

  const productResult = validateProduct(product);
  if (!productResult.valid) return false;

  for (const variant of product.variants) {
    if (!validateVariant(variant).valid) return false;
  }

  return true;
}

/**
 * Check whether a product can be published in the context of a full catalog.
 *
 * This enforces cross-product SKU uniqueness: a product cannot be published
 * if any of its variant SKUs collide with an already-published product's
 * variant SKUs. This is the publication-safety gate.
 */
export function canPublishInCatalog(
  product: CommercialProduct,
  catalog: readonly CommercialProduct[],
): boolean {
  if (!canPublish(product)) return false;

  const otherPublishedSkus = new Set<string>();
  for (const existing of catalog) {
    if (existing.id === product.id) continue;
    if (existing.publicationStatus === "published") {
      for (const variant of existing.variants) {
        otherPublishedSkus.add(variant.sku);
      }
    }
  }

  for (const variant of product.variants) {
    if (otherPublishedSkus.has(variant.sku)) {
      return false;
    }
  }

  return true;
}
