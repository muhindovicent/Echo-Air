import type { Metadata } from "next";
import { WishlistGrid } from "@/components/shop/WishlistGrid";

export const metadata: Metadata = {
  title: "Wishlist — Echo & Air",
  description:
    "Pieces you have saved on this device. Demonstration wishlist: nothing is reserved or ordered.",
};

export default function WishlistPage() {
  return (
    <>
      <section
        aria-labelledby="wishlist-heading"
        className="border-b border-bone/12 bg-obsidian"
      >
        <div className="mx-auto max-w-[1600px] px-5 pb-8 pt-24 md:px-10 md:pb-14 md:pt-40">
          <p className="label text-acid">Wishlist — saved on this device</p>
          <h1
            id="wishlist-heading"
            className="mt-4 text-display font-medium uppercase md:mt-6"
          >
            Saved pieces
          </h1>
          <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-bone/60 md:text-lead">
            A local list kept in your browser. Nothing is reserved, charged or
            ordered — these are demonstration pieces.
          </p>
        </div>
      </section>

      <section aria-label="Saved pieces" className="bg-obsidian">
        <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-16">
          <WishlistGrid />
        </div>
      </section>
    </>
  );
}
