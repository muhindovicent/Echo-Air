/**
 * Demonstration catalogue for Echo & Air.
 *
 * Every record is a **demonstration product**. Garment names are working
 * titles, the copy describes an intended design position rather than a
 * confirmed product, and no commercial information is attached: there is no
 * price, no stock state, no size availability, no review and no purchase
 * option anywhere in this model.
 *
 * Imagery comes from `public/concept` — the placeholder frames carried over
 * from the legacy prototype. Every frame is tagged "Concept" on screen and
 * the catalogue labels itself as demonstration data.
 */

import { conceptImages } from "@/lib/content";

export const PRODUCT_CATEGORIES = [
  { slug: "outerwear", label: "Outerwear" },
  { slug: "knitwear", label: "Knitwear" },
  { slug: "jersey", label: "Jersey" },
  { slug: "trousers", label: "Trousers" },
  { slug: "footwear", label: "Footwear" },
  { slug: "accessories", label: "Accessories" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["slug"];

export const ALL_CATEGORIES = "all" as const;
export type CategoryFilter = ProductCategory | typeof ALL_CATEGORIES;

export type Product = {
  /** Stable identifier used in the `/shop/[slug]` route. */
  slug: string;
  /** Catalogue position, e.g. "01". */
  index: string;
  /** Working title for layout purposes. */
  name: string;
  category: ProductCategory;
  /** Collection the working title belongs to. */
  collection: string;
  /** One line summary of the intended design. */
  tagline: string;
  /** Longer description of the concept. */
  description: string;
  /** Intended construction notes. */
  details: readonly string[];
  /** Intended colourway name. */
  colourway: string;
  /** Primary concept frame. */
  image: string;
  /** Additional concept frames. */
  gallery: readonly string[];
  /** Always true: nothing in this catalogue is a purchasable product. */
  isConcept: true;
  /** Always "not-for-sale": no stock or ordering state exists yet. */
  availability: "not-for-sale";
};

export const PRODUCTS: readonly Product[] = [
  {
    slug: "longform-overcoat",
    index: "01",
    name: "Longform Overcoat",
    category: "outerwear",
    collection: "Drop 01",
    tagline: "Oiled leather, raw hem, cut long.",
    description:
      "The first study in the drop: a long overcut in oiled leather, left raw at the hem so it breaks over the shoe instead of ending on it.",
    details: [
      "Concept spec: oiled leather outer, unlined body",
      "Concept spec: raw hem, patch pockets, dropped shoulder",
      "Intended fit: oversized, long over the knee",
    ],
    colourway: "Black",
    image: conceptImages.outerwear,
    gallery: [conceptImages.campaign, conceptImages.lookFour],
    isConcept: true,
    availability: "not-for-sale",
  },
  {
    slug: "field-wide-trouser",
    index: "02",
    name: "Field Wide Trouser",
    category: "trousers",
    collection: "Drop 01",
    tagline: "Wide straight leg with a deep break.",
    description:
      "A wide straight leg in a dry cotton twill, cut long enough to pool slightly at the shoe. Pleated once at the front, nothing else.",
    details: [
      "Concept spec: dry cotton twill, unbrushed",
      "Concept spec: single front pleat, extended waistband",
      "Intended fit: wide, mid-rise, full length",
    ],
    colourway: "Bone",
    image: conceptImages.featured,
    gallery: [conceptImages.lookTwo, conceptImages.featured],
    isConcept: true,
    availability: "not-for-sale",
  },
  {
    slug: "signal-long-sleeve",
    index: "03",
    name: "Signal Long Sleeve",
    category: "knitwear",
    collection: "Drop 01",
    tagline: "Mid-weight cotton, extended cuff.",
    description:
      "A long sleeve in mid-weight cotton jersey with an extended cuff and a squared shoulder, built to sit under outerwear without bunching.",
    details: [
      "Concept spec: mid-weight cotton jersey",
      "Concept spec: extended cuff, squared shoulder",
      "Intended fit: regular, slightly long in the body",
    ],
    colourway: "Black",
    image: conceptImages.sleeve,
    gallery: [conceptImages.sleeve],
    isConcept: true,
    availability: "not-for-sale",
  },
  {
    slug: "bomber-shell",
    index: "04",
    name: "Bomber Shell",
    category: "outerwear",
    collection: "Drop 01",
    tagline: "Crushed nylon, rib collar.",
    description:
      "A short shell in crushed nylon with a ribbed collar and cuffs, cut close to the body and intended to be layered over everything else in the drop.",
    details: [
      "Concept spec: crushed nylon shell, lightly padded",
      "Concept spec: rib collar and cuffs",
      "Intended fit: close, cropped at the waist",
    ],
    colourway: "Black",
    image: conceptImages.bomber,
    gallery: [conceptImages.bomber, conceptImages.campaign],
    isConcept: true,
    availability: "not-for-sale",
  },
  {
    slug: "interval-runner",
    index: "05",
    name: "Interval Runner",
    category: "footwear",
    collection: "Drop 01",
    tagline: "Low profile sole, tonal upper.",
    description:
      "A low runner with a thin midsole and a tonal upper, kept deliberately quiet so it reads as a base layer rather than a statement.",
    details: [
      "Concept spec: tonal upper, thin rubber midsole",
      "Concept spec: minimal hardware, no visible branding",
      "Intended fit: true to size, narrow through the midfoot",
    ],
    colourway: "Tonal",
    image: conceptImages.runner,
    gallery: [conceptImages.runner],
    isConcept: true,
    availability: "not-for-sale",
  },
  {
    slug: "null-denim",
    index: "06",
    name: "Null Denim",
    category: "trousers",
    collection: "Drop 01",
    tagline: "Wide straight leg, untreated finish.",
    description:
      "Untreated denim in a wide straight leg, left stiff so it breaks in rather than out. No distressing, no logos, no hardware.",
    details: [
      "Concept spec: untreated denim, rigid hand",
      "Concept spec: plain waistband, straight side seam",
      "Intended fit: wide straight, mid-rise",
    ],
    colourway: "Dark Indigo",
    image: conceptImages.denim,
    gallery: [conceptImages.lookThree, conceptImages.denim],
    isConcept: true,
    availability: "not-for-sale",
  },
  {
    slug: "frame-tee",
    index: "07",
    name: "Frame Tee",
    category: "jersey",
    collection: "Drop 01",
    tagline: "240gsm cotton, boxy body.",
    description:
      "A heavy jersey tee with a boxy body and a ribbed neck, weighted so it hangs straight instead of clinging.",
    details: [
      "Concept spec: 240gsm cotton jersey",
      "Concept spec: ribbed neck, bound shoulder seam",
      "Intended fit: boxy, wide body",
    ],
    colourway: "Black",
    image: conceptImages.jersey,
    gallery: [conceptImages.jersey, conceptImages.studio],
    isConcept: true,
    availability: "not-for-sale",
  },
  {
    slug: "signal-frames",
    index: "08",
    name: "Signal Frames",
    category: "accessories",
    collection: "Drop 01",
    tagline: "Shield frames in hard-wear acetate.",
    description:
      "A shield frame in thick acetate, the only hard accessory in the drop, kept in one colourway so it never competes with the clothing.",
    details: [
      "Concept spec: thick acetate, metal hinge",
      "Concept spec: single colourway, no branding",
      "Intended fit: medium frame, wide lens",
    ],
    colourway: "Tortoise",
    image: conceptImages.lookOne,
    gallery: [conceptImages.lookOne],
    isConcept: true,
    availability: "not-for-sale",
  },
  {
    slug: "interval-trouser",
    index: "09",
    name: "Interval Trouser",
    category: "trousers",
    collection: "Drop 01",
    tagline: "Cuffed leg, side seam pocket.",
    description:
      "A shorter trouser with a deep cuff and a low side-seam pocket, cut to sit above the ankle and work with heavier footwear.",
    details: [
      "Concept spec: dry cotton, lightly structured",
      "Concept spec: deep turn-up cuff, low side pocket",
      "Intended fit: straight, cropped at the ankle",
    ],
    colourway: "Charcoal",
    image: conceptImages.lookTwo,
    gallery: [conceptImages.lookTwo],
    isConcept: true,
    availability: "not-for-sale",
  },
  {
    slug: "blackout-denim",
    index: "10",
    name: "Blackout Denim",
    category: "trousers",
    collection: "Drop 01",
    tagline: "Blackened denim, minimal hardware.",
    description:
      "The same five-pocket block as the Null Denim, washed down to near black so the seams read as the only detail on the garment.",
    details: [
      "Concept spec: blackened denim, tonal stitching",
      "Concept spec: plain hardware, no visible branding",
      "Intended fit: straight, mid-rise",
    ],
    colourway: "Washed Black",
    image: conceptImages.lookThree,
    gallery: [conceptImages.lookThree],
    isConcept: true,
    availability: "not-for-sale",
  },
  {
    slug: "longform-jacket",
    index: "11",
    name: "Longform Jacket",
    category: "outerwear",
    collection: "Drop 01",
    tagline: "Cropped biker, chrome hardware.",
    description:
      "A cropped biker jacket with a wide collar and chrome hardware, treated as the sharpest object in the drop and photographed accordingly.",
    details: [
      "Concept spec: lamb leather, cropped body",
      "Concept spec: wide collar, chrome hardware",
      "Intended fit: cropped, close through the body",
    ],
    colourway: "Black",
    image: conceptImages.lookFour,
    gallery: [conceptImages.lookFour],
    isConcept: true,
    availability: "not-for-sale",
  },
  {
    slug: "field-tee",
    index: "12",
    name: "Field Tee",
    category: "jersey",
    collection: "Drop 01",
    tagline: "Boxy jersey, ribbed neck.",
    description:
      "The plainest piece in the catalogue and the one everything else is built around: a boxy jersey with a ribbed neck and no graphics.",
    details: [
      "Concept spec: heavyweight cotton jersey",
      "Concept spec: ribbed neck, no graphics",
      "Intended fit: boxy, wide body",
    ],
    colourway: "Optic White",
    image: conceptImages.studio,
    gallery: [conceptImages.studio],
    isConcept: true,
    availability: "not-for-sale",
  },
] as const;

export const SORT_OPTIONS = [
  { value: "catalogue", label: "Catalogue order" },
  { value: "name-asc", label: "Name A–Z" },
  { value: "name-desc", label: "Name Z–A" },
  { value: "category", label: "Category" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const CATALOGUE_DISCLAIMER =
  "Demonstration catalogue. Every piece is a working title for layout purposes — no pricing, stock, sizing, reviews or ordering exists.";

/**
 * Short form used on small screens, where the full paragraph pushed the
 * search field and the products too far down the page. The full wording stays
 * in the footer disclosure on every screen size.
 */
export const CATALOGUE_DISCLAIMER_SHORT =
  "Demonstration data — nothing here can be ordered.";

export function categoryLabel(slug: CategoryFilter): string {
  if (slug === ALL_CATEGORIES) return "All pieces";
  return (
    PRODUCT_CATEGORIES.find((category) => category.slug === slug)?.label ?? slug
  );
}

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((product) => product.slug === slug);
}

export function categoryCounts(
  products: readonly Product[] = PRODUCTS,
): { slug: CategoryFilter; label: string; count: number }[] {
  const counts = new Map<ProductCategory, number>();
  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }

  return [
    { slug: ALL_CATEGORIES, label: "All pieces", count: products.length },
    ...PRODUCT_CATEGORIES.map((category) => ({
      slug: category.slug as CategoryFilter,
      label: category.label,
      count: counts.get(category.slug) ?? 0,
    })),
  ];
}

export function sortProducts(
  products: readonly Product[],
  sort: SortOption,
): Product[] {
  const sorted = [...products];
  switch (sort) {
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case "name-desc":
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case "category":
      return sorted.sort(
        (a, b) =>
          a.category.localeCompare(b.category) ||
          a.index.localeCompare(b.index),
      );
    case "catalogue":
    default:
      return sorted.sort((a, b) => a.index.localeCompare(b.index));
  }
}

export function matchesQuery(product: Product, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;

  return [
    product.name,
    product.category,
    product.collection,
    product.tagline,
    product.colourway,
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

/** Sibling pieces used for the previous/next links on a product page. */
export function siblingProducts(slug: string): {
  previous: Product | undefined;
  next: Product | undefined;
} {
  const index = PRODUCTS.findIndex((product) => product.slug === slug);
  if (index === -1) return { previous: undefined, next: undefined };

  return {
    previous: index > 0 ? PRODUCTS[index - 1] : PRODUCTS[PRODUCTS.length - 1],
    next:
      index < PRODUCTS.length - 1
        ? PRODUCTS[index + 1]
        : PRODUCTS[0],
  };
}
