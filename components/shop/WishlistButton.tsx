"use client";

import { useWishlist } from "@/components/shop/WishlistProvider";

type WishlistButtonProps = {
  slug: string;
  /** Name used in the button label. */
  name: string;
  className?: string;
};

/**
 * Saves or removes a demonstration piece from the wishlist. The state lives in
 * React and `localStorage`; nothing is ordered or reserved.
 */
export function WishlistButton({
  slug,
  name,
  className,
}: WishlistButtonProps) {
  const { has, toggle, ready } = useWishlist();
  const saved = has(slug);

  return (
    <button
      type="button"
      onClick={() => toggle(slug)}
      data-testid="wishlist-toggle"
      aria-pressed={ready ? saved : false}
      className={
        className ??
        "label inline-flex items-center gap-3 border border-bone/25 px-6 py-4 text-bone transition-colors duration-300 hover:border-acid hover:text-acid"
      }
    >
      <span aria-hidden="true">{saved ? "★" : "☆"}</span>
      {saved ? "Saved to wishlist" : "Save to wishlist"}
      <span className="sr-only"> — {name}</span>
    </button>
  );
}
