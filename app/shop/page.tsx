import type { Metadata } from "next";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import { CATALOGUE_DISCLAIMER, PRODUCTS } from "@/lib/products";

export const metadata: Metadata = {
  title: "Shop — Demonstration Catalogue",
  description:
    "The Echo & Air demonstration catalogue: working titles, concept imagery and no commercial information. Nothing here can be ordered.",
};

export default function ShopPage() {
  return (
    <>
      <section
        aria-labelledby="shop-heading"
        className="border-b border-bone/12 bg-obsidian"
      >
        <div className="mx-auto max-w-[1600px] px-5 pb-14 pt-32 md:px-10 md:pb-16 md:pt-40">
          <p className="label text-acid">Shop — demonstration catalogue</p>
          <h1
            id="shop-heading"
            className="mt-6 text-display font-medium uppercase"
          >
            The catalogue
          </h1>
          <div className="mt-8 grid gap-8 border-t border-bone/12 pt-8 md:grid-cols-12">
            <p className="text-lead text-bone/75 md:col-span-6">
              Every working title from the Drop 01 study, cut into categories so
              the range can be read at a glance.
            </p>
            <p className="text-[0.9rem] leading-relaxed text-bone/55 md:col-span-5 md:col-start-8">
              {CATALOGUE_DISCLAIMER}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-label="Catalogue browser"
        className="bg-obsidian"
      >
        <div className="mx-auto max-w-[1600px] px-5 py-12 md:px-10 md:py-16">
          <ShopBrowser products={PRODUCTS} />
        </div>
      </section>
    </>
  );
}
