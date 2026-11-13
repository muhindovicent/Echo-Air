"use client";

import Link from "next/link";
import { BagLineItem } from "@/components/shop/BagLineItem";
import { useBag } from "@/components/shop/BagProvider";

/**
 * The full demonstration bag.
 *
 * It lists what was picked with the demonstration size and colour label, and
 * offers quantity and removal controls. There is no price, total, stock,
 * delivery information or checkout anywhere on this page.
 */
export function BagPageContent() {
  const { lines, count, ready, clear } = useBag();

  return (
    <>
      <section
        aria-labelledby="bag-heading"
        className="border-b border-bone/12 bg-obsidian"
      >
        <div className="mx-auto max-w-[1600px] px-5 pb-8 pt-24 md:px-10 md:pb-14 md:pt-40">
          <p className="label text-acid">Demo bag — demonstration only</p>
          <h1
            id="bag-heading"
            className="mt-4 text-display font-medium uppercase md:mt-6"
          >
            Your bag
          </h1>
          <p className="mt-6 max-w-xl text-[0.95rem] leading-relaxed text-bone/60 md:text-lead">
            A local record of the pieces you picked, kept in this browser. No
            price, stock, delivery or checkout is involved — nothing here can be
            ordered.
          </p>
        </div>
      </section>

      <section aria-label="Bag contents" className="bg-obsidian">
        <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-16">
          {!ready ? (
            <p className="label text-ash" aria-live="polite">
              Loading your bag…
            </p>
          ) : lines.length === 0 ? (
            <div
              data-testid="bag-empty"
              className="border border-bone/12 bg-obsidian-soft px-6 py-16 text-center"
            >
              <p className="label text-acid">Nothing in the bag</p>
              <h2 className="mt-5 text-section font-medium uppercase">
                Your bag is empty
              </h2>
              <p className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-bone/60">
                Pick a piece from the catalogue, choose a demonstration size and
                colour label, and it will appear here. The bag is stored on this
                device only.
              </p>
              <Link
                href="/shop"
                className="label mt-8 inline-flex items-center gap-3 border border-acid bg-acid px-6 py-4 text-obsidian transition-colors duration-300 hover:bg-bone hover:border-bone"
              >
                Browse the catalogue
              </Link>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-bone/12 pb-5">
                <p className="label text-bone/70" aria-live="polite">
                  {count} {count === 1 ? "piece" : "pieces"} — demonstration
                  selections
                </p>
                <button
                  type="button"
                  onClick={clear}
                  className="label text-bone/60 underline-offset-4 transition-colors duration-300 hover:text-acid hover:underline"
                >
                  Clear bag
                </button>
              </div>

              <ul className="mt-6 max-w-3xl">
                {lines.map((line) => (
                  <BagLineItem key={line.key} line={line} layout="page" />
                ))}
              </ul>

              <div className="mt-10 max-w-3xl border border-bone/12 bg-obsidian-soft p-6">
                <div className="border-l-2 border-acid/70 pl-4">
                  <p className="label text-acid">No checkout here</p>
                  <p className="mt-3 text-[0.9rem] leading-relaxed text-bone/70">
                    This build has no pricing, inventory, delivery or payment
                    system. The bag is a demonstration of the product
                    experience, kept in your browser, and nothing in it can be
                    bought.
                  </p>
                </div>
                <Link
                  href="/shop"
                  className="label mt-6 inline-flex items-center gap-3 border border-bone/25 px-5 py-3 text-bone transition-colors duration-300 hover:border-acid hover:text-acid"
                >
                  Keep browsing
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
