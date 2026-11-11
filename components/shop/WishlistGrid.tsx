"use client";

import Link from "next/link";
import { ProductCard } from "@/components/shop/ProductCard";
import { useWishlist } from "@/components/shop/WishlistProvider";
import { PRODUCTS } from "@/lib/products";

/**
 * Saved pieces. The list is stored in `localStorage` as product slugs, so it
 * survives a reload and stays on the device.
 */
export function WishlistGrid() {
  const { slugs, ready, remove, clear } = useWishlist();

  const saved = slugs
    .map((slug) => PRODUCTS.find((product) => product.slug === slug))
    .filter((product): product is (typeof PRODUCTS)[number] => Boolean(product));

  if (!ready) {
    return (
      <p className="label text-ash" aria-live="polite">
        Loading saved pieces…
      </p>
    );
  }

  if (saved.length === 0) {
    return (
      <div
        data-testid="wishlist-empty"
        className="border border-bone/12 bg-obsidian-soft px-6 py-16 text-center"
      >
        <p className="label text-acid">Nothing saved</p>
        <h2 className="mt-5 text-section font-medium uppercase">
          Your wishlist is empty
        </h2>
        <p className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-bone/60">
          Save a demonstration piece while you browse and it will stay here on
          this device. Nothing is reserved or ordered.
        </p>
        <Link
          href="/shop"
          className="label mt-8 inline-flex items-center gap-3 border border-acid bg-acid px-6 py-4 text-obsidian transition-colors duration-300 hover:bg-bone hover:border-bone"
        >
          Browse the catalogue
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-bone/12 pb-5">
        <p className="label text-bone/70" aria-live="polite">
          {saved.length} {saved.length === 1 ? "piece" : "pieces"} saved on this
          device
        </p>
        <button
          type="button"
          onClick={clear}
          className="label text-bone/60 underline-offset-4 transition-colors duration-300 hover:text-acid hover:underline"
        >
          Clear wishlist
        </button>
      </div>

      <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {saved.map((product) => (
          <li key={product.slug}>
            <ProductCard product={product} />
            <button
              type="button"
              onClick={() => remove(product.slug)}
              className="label mt-3 text-bone/55 underline-offset-4 transition-colors duration-300 hover:text-acid hover:underline"
            >
              Remove {product.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
