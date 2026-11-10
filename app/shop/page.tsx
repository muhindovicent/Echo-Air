import type { Metadata } from "next";
import { ShopBrowser } from "@/components/shop/ShopBrowser";
import {
  CATALOGUE_DISCLAIMER,
  CATALOGUE_DISCLAIMER_SHORT,
  PRODUCTS,
} from "@/lib/products";

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
        <div className="mx-auto max-w-[1600px] px-5 pb-8 pt-24 md:px-10 md:pb-16 md:pt-40">
          <p className="label text-acid">Shop — demonstration catalogue</p>
          <h1
            id="shop-heading"
            className="mt-4 text-display font-medium uppercase md:mt-6"
          >
            The catalogue
          </h1>
          <div className="mt-6 border-t border-bone/12 pt-5 md:mt-8 md:grid md:grid-cols-12 md:gap-8 md:pt-8">
            <p className="text-[0.95rem] leading-relaxed text-bone/70 md:col-span-6 md:text-lead">
              Every working title from the Drop 01 study, cut into categories so
              the range can be read at a glance.
            </p>
            <p className="mt-4 text-[0.85rem] leading-relaxed text-bone/55 md:col-span-5 md:col-start-8 md:mt-0 md:text-[0.9rem]">
              <span className="md:hidden">{CATALOGUE_DISCLAIMER_SHORT}</span>
              <span className="hidden md:inline">{CATALOGUE_DISCLAIMER}</span>
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Catalogue browser" className="bg-obsidian">
        <div className="mx-auto max-w-[1600px] px-5 py-8 md:px-10 md:py-16">
          <ShopBrowser products={PRODUCTS} />
        </div>
      </section>
    </>
  );
}
