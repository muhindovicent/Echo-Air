/**
 * Runtime validation for Echo & Air commerce records.
 *
 * All validation is pure: no side effects, no dependencies on the frontend
 * or on any backend. A record is valid only when every field is present,
 * correctly typed and consistent with the rest of the catalog (e.g. unique
 * IDs, slugs, variant IDs and SKUs across products). Invalid records can
 * never be published.
 *
 * Validation is defensive: malformed products, null variants and invalid
 * catalog records are rejected without throwing exceptions.
 */

import type {
  CommercialProduct,
  CurrencyCode,
  Price,
  ProductVariant,
  ValidationResult,
} from "./types.ts";

/** Recognized ISO 4217 currency codes. */
export const CURRENCIES: readonly CurrencyCode[] = ["USD", "EUR", "GBP", "UGX"];

/** Zero-decimal currencies have no minor-unit subdivision. */
export const ZERO_DECIMAL_CURRENCIES: readonly CurrencyCode[] = ["UGX"];

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

/**
 * A valid ISO 8601 timestamp value.
 *
 * Checks both the string format and that the value parses to a real date.
 * JavaScript's Date is lenient (e.g. "2023-02-29" rolls over to March 1),
 * so we validate the calendar components extracted from the string against
 * what Date.UTC produces, catching day/month overflow and invalid leap days
 * for both UTC and timezone-offset timestamps.
 */
function isValidIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return false;
  }

  // Extract calendar components from the string as written.
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));

  // Basic range checks.
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Date.UTC normalizes out-of-range dates, so round-trip check catches
  // invalid leap days and day/month overflow regardless of timezone offset.
  const ms = Date.UTC(year, month - 1, day);
  if (Number.isNaN(ms)) return false;
  const check = new Date(ms);
  if (check.getUTCFullYear() !== year) return false;
  if (check.getUTCMonth() !== month - 1) return false;
  if (check.getUTCDate() !== day) return false;

  // The full string must also parse to a real time.
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
}

/** A valid inventory quantity: a non-negative integer. */
export function isValidInventory(value: unknown): value is number {
  return isValidNonNegativeInteger(value);
}

/** Type guard for a Price-shaped object. */
function isPriceShape(value: unknown): value is { amount: unknown; currency: unknown } {
  return typeof value === "object" && value !== null;
}

/** Safely reads variants from a product, returning an empty array if missing
 *  or malformed. Never throws. */
function safeVariants(product: Record<string, unknown>): readonly unknown[] {
  const variants = product.variants;
  if (!Array.isArray(variants)) return [];
  return variants;
}

/** Compute the final variant price in minor currency units. */
export function variantFinalPrice(
  basePrice: Price,
  variant: Pick<ProductVariant, "priceAdjustment">,
): number {
  return basePrice.amount + variant.priceAdjustment;
}

/** Sum variant inventories to derive product-level inventory. */
export function deriveProductInventory(
  variants: readonly ProductVariant[],
): number {
  let total = 0;
  for (const variant of variants) {
    if (!variant || typeof variant !== "object") continue;
    if (isValidInventory((variant as Record<string, unknown>).inventory)) {
      total += (variant as Record<string, unknown>).inventory as number;
    }
  }
  return total;
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

  if (!Array.isArray(v.images) || v.images.length === 0) {
    errors.push("Variant images must be a non-empty array of image sources.");
  } else if (v.images.some((img) => !isValidImage(img))) {
    errors.push("Variant images must be an array of non-empty strings.");
  }

  if (!isValidInteger(v.priceAdjustment)) {
    errors.push("Variant price adjustment must be an integer (minor currency units).");
  }

  if (!isValidInventory(v.inventory)) {
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

  const priceResult = validatePrice(p.price);
  errors.push(...priceResult.errors);

  // Variant inventory is authoritative. Product inventory must equal the sum
  // of all variant inventories.
  const variants = safeVariants(p);
  const variantInventoryTotal = deriveProductInventory(
    variants as readonly ProductVariant[],
  );

  if (!isValidInventory(p.inventory)) {
    errors.push("Product inventory must be a non-negative integer.");
  } else if ((p.inventory as number) !== variantInventoryTotal) {
    errors.push(
      `Product inventory (${p.inventory}) does not equal the sum of variant inventories (${variantInventoryTotal}).`,
    );
  }

  if (
    typeof p.publicationStatus !== "string" ||
    !["draft", "published", "unpublished"].includes(p.publicationStatus)
  ) {
    errors.push('Product publicationStatus must be "draft", "published" or "unpublished".');
  }

  const variantSkus: string[] = [];
  const variantIds: string[] = [];

  if (!Array.isArray(p.variants) || p.variants.length === 0) {
    errors.push("Product must have at least one variant.");
  } else {
    for (const variant of p.variants) {
      const variantResult = validateVariant(variant, [
        ...allSkus,
        ...variantSkus,
      ]);
      errors.push(...variantResult.errors);

      // Skip further processing for invalid/null variants to avoid
      // property access errors on malformed records.
      if (!variantResult.valid || !variant || typeof variant !== "object") {
        continue;
      }

      const v = variant as Record<string, unknown>;

      if (isValidSku(v.sku)) {
        variantSkus.push(v.sku);
      }

      if (isValidSku(v.id)) {
        variantIds.push(v.id);
      }

      // Final variant price (base + adjustment) must not be negative.
      if (
        priceResult.valid &&
        isValidInteger(v.priceAdjustment) &&
        typeof p.price === "object" &&
        p.price !== null &&
        isValidNonNegativeInteger((p.price as { amount: unknown }).amount)
      ) {
        const finalPrice =
          (p.price as { amount: number }).amount + (v.priceAdjustment as number);
        if (finalPrice < 0) {
          errors.push(
            `Variant "${isValidSku(v.sku) ? v.sku : "unknown"}" has a negative final price (base ${(p.price as { amount: number }).amount} + adjustment ${v.priceAdjustment} = ${finalPrice}).`,
          );
        }
      }
    }

    // Variant IDs must be unique within the product.
    const seenVariantIds = new Set<string>();
    for (const variantId of variantIds) {
      if (seenVariantIds.has(variantId)) {
        errors.push(`Variant id "${variantId}" is not unique within the product.`);
      }
      seenVariantIds.add(variantId);
    }
  }

  if (!isValidIsoTimestamp(p.createdAt)) {
    errors.push("Product createdAt must be a valid ISO 8601 timestamp.");
  }

  if (!isValidIsoTimestamp(p.updatedAt)) {
    errors.push("Product updatedAt must be a valid ISO 8601 timestamp.");
  }

  return { valid: errors.length === 0, errors };
}

/** Validate catalog-wide uniqueness of product IDs, slugs, variant IDs and SKUs.
 *
 * Defensive: malformed products, null variants and invalid catalog records
 * are rejected without throwing exceptions.
 */
export function validateCatalog(
  catalog: readonly CommercialProduct[],
): ValidationResult {
  const errors: string[] = [];

  const seenProductIds = new Set<string>();
  const seenProductSlugs = new Set<string>();
  const seenVariantIds = new Set<string>();
  const seenVariantSkus = new Set<string>();

  for (const product of catalog) {
    if (!product || typeof product !== "object") {
      errors.push("Catalog contains a non-object product entry.");
      continue;
    }

    const p = product as Record<string, unknown>;

    // Product ID uniqueness.
    if (isValidSku(p.id)) {
      if (seenProductIds.has(p.id)) {
        errors.push(`Product id "${p.id}" is not unique across the catalog.`);
      }
      seenProductIds.add(p.id);
    }

    // Product slug uniqueness.
    if (isValidSku(p.slug)) {
      if (seenProductSlugs.has(p.slug)) {
        errors.push(`Product slug "${p.slug}" is not unique across the catalog.`);
      }
      seenProductSlugs.add(p.slug);
    }

    // Individual product validity.
    const productErrors = validateProduct(product).errors;
    for (const error of productErrors) {
      errors.push(`[${isValidSku(p.slug) ? p.slug : isValidSku(p.id) ? p.id : "unknown"}] ${error}`);
    }

    // Variant-level uniqueness across catalog (only for valid variants).
    const variants = safeVariants(p);
    for (const variant of variants) {
      if (!variant || typeof variant !== "object") continue;

      const v = variant as Record<string, unknown>;

      if (isValidSku(v.id)) {
        if (seenVariantIds.has(v.id)) {
          errors.push(`Variant id "${v.id}" is not unique across the catalog.`);
        }
        seenVariantIds.add(v.id);
      }

      if (isValidSku(v.sku)) {
        if (seenVariantSkus.has(v.sku)) {
          errors.push(`Variant SKU "${v.sku}" is not unique across the catalog.`);
        }
        seenVariantSkus.add(v.sku);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/** Check whether a product is complete and verified enough to publish. */
export function canPublish(product: CommercialProduct): boolean {
  if (!product || typeof product !== "object") return false;
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
 * Enforces:
 * - The product itself passes validation (canPublish).
 * - Cross-product uniqueness of product IDs, slugs, variant IDs and SKUs
 *   against already-published products.
 *
 * Different products that share an ID cannot bypass uniqueness validation:
 * self-exclusion uses object reference equality, not ID equality.
 */
export function canPublishInCatalog(
  product: CommercialProduct,
  catalog: readonly CommercialProduct[],
): boolean {
  if (!canPublish(product)) return false;

  const otherPublishedIds = new Set<string>();
  const otherPublishedSlugs = new Set<string>();
  const otherPublishedVariantIds = new Set<string>();
  const otherPublishedVariantSkus = new Set<string>();

  for (const existing of catalog) {
    if (!existing || typeof existing !== "object") continue;

    // Skip self (same object reference) to allow re-publishing an existing
    // product. Different products that share an ID are still conflicts.
    if (existing === product) continue;
    if (existing.publicationStatus !== "published") continue;

    otherPublishedIds.add(existing.id);
    otherPublishedSlugs.add(existing.slug);

    for (const variant of existing.variants) {
      if (!variant || typeof variant !== "object") continue;
      otherPublishedVariantIds.add(variant.id);
      otherPublishedVariantSkus.add(variant.sku);
    }
  }

  if (otherPublishedIds.has(product.id)) return false;
  if (otherPublishedSlugs.has(product.slug)) return false;

  for (const variant of product.variants) {
    if (!variant || typeof variant !== "object") continue;
    if (otherPublishedVariantIds.has(variant.id)) return false;
    if (otherPublishedVariantSkus.has(variant.sku)) return false;
  }

  return true;
}
