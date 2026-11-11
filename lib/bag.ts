/**
 * Demonstration shopping bag.
 *
 * The bag is a **demonstration only**: it records which piece you picked, in
 * which demonstration size and colour label, and how many. It stores no
 * prices, no totals, no stock levels, no delivery information and no payment
 * details, because none of those exist for the concept catalogue.
 *
 * This module holds the pure model and helpers. The React store that persists
 * the bag lives in `components/shop/BagProvider.tsx`.
 */

import { PRODUCTS, type Product, type ProductColour } from "@/lib/products";

/** The stored shape: identifiers only, so the data stays small and stable. */
export type BagEntry = {
  /** Product slug. */
  slug: string;
  /** Selected demonstration size label. */
  size: string;
  /** Selected demonstration colourway id. */
  colour: string;
  /** How many of this exact selection. */
  quantity: number;
};

/** A stored entry resolved against the demonstration catalogue. */
export type BagLine = {
  /** Identity of the line: product, size and colour. */
  key: string;
  product: Product;
  size: string;
  colour: ProductColour;
  quantity: number;
};

/** Lowest and highest quantity a line can hold. */
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;

/** Stable identity of a selection: two entries with the same key are one line. */
export function lineKey(entry: Pick<BagEntry, "slug" | "size" | "colour">) {
  return `${entry.slug}|${entry.size}|${entry.colour}`;
}

export function isBagEntry(value: unknown): value is BagEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Partial<BagEntry>;
  return (
    typeof entry.slug === "string" &&
    typeof entry.size === "string" &&
    typeof entry.colour === "string" &&
    typeof entry.quantity === "number"
  );
}

/**
 * Drops anything that does not match the current demonstration catalogue and
 * merges entries that describe the same selection.
 */
export function sanitiseEntries(value: unknown): BagEntry[] {
  if (!Array.isArray(value)) return [];

  const merged: BagEntry[] = [];

  for (const raw of value) {
    if (!isBagEntry(raw)) continue;

    const product = PRODUCTS.find((item) => item.slug === raw.slug);
    if (!product) continue;

    const size = product.sizes.find((item) => item === raw.size);
    if (!size) continue;

    const colour = product.colours.find((item) => item.id === raw.colour);
    if (!colour) continue;

    const quantity = Math.min(
      MAX_QUANTITY,
      Math.max(MIN_QUANTITY, Math.floor(raw.quantity)),
    );

    const entry: BagEntry = {
      slug: product.slug,
      size,
      colour: colour.id,
      quantity,
    };

    const existing = merged.find((item) => lineKey(item) === lineKey(entry));
    if (existing) {
      existing.quantity = Math.min(
        MAX_QUANTITY,
        existing.quantity + entry.quantity,
      );
    } else {
      merged.push(entry);
    }
  }

  return merged;
}

/** Adds a selection, combining it with an existing line when it matches. */
export function mergeEntry(
  entries: readonly BagEntry[],
  incoming: BagEntry,
): BagEntry[] {
  const sanitised = sanitiseEntries([...entries, incoming]);
  return sanitised;
}

/** Resolves stored entries into displayable lines. */
export function resolveLines(entries: readonly BagEntry[]): BagLine[] {
  const lines: BagLine[] = [];

  for (const entry of entries) {
    const product = PRODUCTS.find((item) => item.slug === entry.slug);
    if (!product) continue;

    const colour = product.colours.find((item) => item.id === entry.colour);
    if (!colour) continue;

    lines.push({
      key: lineKey(entry),
      product,
      size: entry.size,
      colour,
      quantity: entry.quantity,
    });
  }

  return lines;
}

/** Total number of pieces in the bag. */
export function countItems(entries: readonly BagEntry[]): number {
  return entries.reduce((total, entry) => total + entry.quantity, 0);
}

/** Number of distinct lines in the bag. */
export function countLines(entries: readonly BagEntry[]): number {
  return entries.length;
}
