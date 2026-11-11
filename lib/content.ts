/**
 * Editorial content for the Echo & Air concept storefront.
 *
 * IMPORTANT — imagery: every file below is a *concept asset* carried over
 * from the legacy static site. None of it is Echo & Air brand photography.
 * It art-directs the layout until the studio supplies real campaign imagery,
 * every frame is tagged "Concept" on screen, and the images are graded into a
 * single monochrome + acid-green duotone so the placeholders read as one
 * campaign rather than unrelated stock.
 *
 * `focus` and `zoom` crop into each source frame so third-party marks that
 * appear in the legacy stock (retailer labels, competitor logos) fall outside
 * the visible area.
 */

export const conceptImages = {
  /** Campaign frame — full-length silhouette, used as the hero backdrop. */
  campaign: "/concept/hero.jpg",
  /** Featured arrival — editorial full-length frame. */
  featured: "/concept/featured.jpg",
  /** Studio frame — neutral torso crop used in the brand story. */
  studio: "/concept/studio.jpg",
  /** Lookbook frames. */
  lookOne: "/concept/look-01.jpg",
  lookTwo: "/concept/look-02.jpg",
  lookThree: "/concept/look-03.jpg",
  lookFour: "/concept/look-04.jpg",
  /** Arrival thumbnails. */
  sleeve: "/concept/piece-sleeve.jpg",
  outerwear: "/concept/piece-outerwear.jpg",
  bomber: "/concept/piece-bomber.jpg",
  runner: "/concept/piece-runner.jpg",
  denim: "/concept/piece-denim.jpg",
  jersey: "/concept/piece-jersey.jpg",
} as const;

export type NavItem = {
  label: string;
  href: string;
};

/**
 * Primary navigation. Homepage sections are addressed with absolute paths so
 * the same links resolve correctly from the catalogue and product pages.
 */
export const navItems: NavItem[] = [
  { label: "Shop", href: "/shop" },
  { label: "New Arrivals", href: "/#new-arrivals" },
  { label: "Lookbook", href: "/#lookbook" },
  { label: "Studio", href: "/#studio" },
];

/**
 * Hero metadata describes the state of this build only. Season, launch dates
 * and any other commercial detail stay unstated until the business confirms
 * them.
 */
export const heroMeta: { label: string; value: string }[] = [
  { label: "Build", value: "Phase 03 — concept" },
  { label: "Release", value: "Drop 01 — preview" },
  { label: "Status", value: "Not on sale, no checkout" },
  { label: "Scroll", value: "01 — New arrivals" },
];

export type Arrival = {
  index: string;
  name: string;
  category: string;
  detail: string;
  image: string;
  imageAlt: string;
  focus: string;
  zoom: number;
};

export const featuredArrival = {
  index: "01",
  name: "Field Wide Trouser",
  category: "Trousers — Drop 01",
  detail:
    "Wide straight leg, unfinished hem, deep break at the shoe. Cut long so it reads as a silhouette rather than a garment.",
  image: conceptImages.featured,
  imageAlt:
    "Concept image: editorial full-length styling shot in a lit studio",
  focus: "50% 25%",
  zoom: 1,
  note: "Look 01",
};

export const arrivals: Arrival[] = [
  {
    index: "02",
    name: "Signal Long Sleeve",
    category: "Knitwear",
    detail: "Mid-weight cotton, extended cuff.",
    image: conceptImages.sleeve,
    imageAlt: "Concept image: dark long sleeve garment on a hanger",
    focus: "50% 60%",
    zoom: 1.2,
  },
  {
    index: "03",
    name: "Longform Overcoat",
    category: "Outerwear",
    detail: "Oiled leather, raw hem.",
    image: conceptImages.outerwear,
    imageAlt: "Concept image: dark outerwear laid flat",
    focus: "35% 80%",
    zoom: 1.2,
  },
  {
    index: "04",
    name: "Bomber Shell",
    category: "Outerwear",
    detail: "Crushed nylon, rib collar.",
    image: conceptImages.bomber,
    imageAlt: "Concept image: bomber jacket layered over a tee",
    focus: "50% 30%",
    zoom: 1.15,
  },
  {
    index: "05",
    name: "Interval Runner",
    category: "Footwear",
    detail: "Low profile sole, tonal upper.",
    image: conceptImages.runner,
    imageAlt: "Concept image: low profile sneaker on a plain surface",
    focus: "35% 60%",
    zoom: 1.15,
  },
  {
    index: "06",
    name: "Null Denim",
    category: "Trousers",
    detail: "Wide straight leg, untreated finish.",
    image: conceptImages.denim,
    imageAlt: "Concept image: folded dark denim",
    focus: "80% 70%",
    zoom: 1.2,
  },
];

export type Look = {
  id: string;
  title: string;
  caption: string;
  image: string;
  imageAlt: string;
  focus: string;
  zoom: number;
};

export const looks: Look[] = [
  {
    id: "Look 01",
    title: "Signal Frames",
    caption: "Drop 01 — accessory study",
    image: conceptImages.lookOne,
    imageAlt: "Concept image: eyewear detail in hard sunlight",
    focus: "50% 45%",
    zoom: 1,
  },
  {
    id: "Look 02",
    title: "Interval Trouser",
    caption: "Drop 01 — trouser study",
    image: conceptImages.lookTwo,
    imageAlt: "Concept image: cuffed trouser leg against a concrete ledge",
    focus: "50% 50%",
    zoom: 1,
  },
  {
    id: "Look 03",
    title: "Null Denim",
    caption: "Drop 01 — denim study",
    image: conceptImages.lookThree,
    imageAlt: "Concept image: folded dark denim detail",
    focus: "50% 50%",
    zoom: 1,
  },
  {
    id: "Look 04",
    title: "Longform Overcoat",
    caption: "Drop 01 — outerwear study",
    image: conceptImages.lookFour,
    imageAlt: "Concept image: dark outerwear folded on a pale ground",
    focus: "50% 50%",
    zoom: 1,
  },
];

/**
 * Design principles for the concept build. They describe the intended design
 * position, not confirmed production practices — nothing here has been
 * verified with the business.
 */
export const principles: { index: string; title: string; body: string }[] = [
  {
    index: "01",
    title: "Weight before logo",
    body: "The silhouette should carry the brand. Hardware stays quiet so the fabric, the cut and the movement of the garment do the talking.",
  },
  {
    index: "02",
    title: "Small runs, long life",
    body: "The intent is limited runs and repairable pieces, designed to be re-worn rather than replaced at the end of a season.",
  },
  {
    index: "03",
    title: "Photographed in the dark",
    body: "Campaigns should be shot in low light and hard shadow, treating clothes as objects with a mood rather than props in a set.",
  },
];

export const footerColumns: { title: string; links: NavItem[] }[] = [
  {
    title: "Navigate",
    links: [
      { label: "Shop", href: "/shop" },
      { label: "Wishlist", href: "/wishlist" },
      { label: "New Arrivals", href: "/#new-arrivals" },
      { label: "Lookbook", href: "/#lookbook" },
      { label: "Studio", href: "/#studio" },
    ],
  },
];

/**
 * No verified contact channel, address or trading details exist yet, so the
 * footer states that instead of publishing a placeholder address or an
 * invented email address.
 */
export const contactStatus = {
  label: "Contact",
  value: "No verified contact channel yet",
  note: "Studio address, press enquiries and stockist details are pending confirmation from the business, so none are published here.",
};

/**
 * Fixed so the build output stays deterministic (a `new Date()` read during
 * prerender is treated as an unstable value by Next.js cache components).
 */
export const copyrightYear = 2026;
