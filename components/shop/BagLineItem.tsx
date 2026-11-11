"use client";

import Image from "next/image";
import Link from "next/link";
import { useBag } from "@/components/shop/BagProvider";
import type { BagLine } from "@/lib/bag";

type BagLineItemProps = {
  line: BagLine;
  /** `drawer` is the compact layout used in the drawer. */
  layout?: "drawer" | "page";
};

/**
 * One line of the demonstration bag: the frame, the piece, the selected
 * demonstration size and colour label and a quantity stepper.
 */
export function BagLineItem({ line, layout = "drawer" }: BagLineItemProps) {
  const { increment, decrement, remove } = useBag();
  const frame = line.product.views[0];

  return (
    <li
      data-testid="bag-line"
      data-key={line.key}
      className="flex gap-4 border-b border-bone/12 py-5 first:pt-0 last:border-b-0"
    >
      <Link
        href={`/shop/${line.product.slug}`}
        className="relative block h-24 w-20 shrink-0 overflow-hidden bg-obsidian-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid"
        style={{ aspectRatio: "3 / 4" }}
      >
        {frame ? (
          <Image
            src={frame.src}
            alt={frame.alt}
            fill
            sizes="80px"
            className="object-cover grayscale"
          />
        ) : null}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/shop/${line.product.slug}`}
              className="text-[1rem] font-medium leading-snug transition-colors duration-300 hover:text-acid"
            >
              {line.product.name}
            </Link>
            <p className="label mt-2 text-ash">
              Size {line.size} — {line.colour.name}
            </p>
          </div>

          <button
            type="button"
            onClick={() => remove(line.key)}
            className="label shrink-0 text-bone/50 underline-offset-4 transition-colors duration-300 hover:text-acid hover:underline"
          >
            Remove
            <span className="sr-only"> {line.product.name} from the bag</span>
          </button>
        </div>

        <div className="mt-auto flex items-center gap-4 pt-4">
          <div className="flex items-center border border-bone/20">
            <button
              type="button"
              onClick={() => decrement(line.key)}
              aria-label={`Decrease quantity of ${line.product.name}, size ${line.size}`}
              className="grid h-9 w-9 place-items-center text-bone/80 transition-colors duration-300 hover:bg-bone/10 hover:text-acid"
            >
              <span aria-hidden="true">&minus;</span>
            </button>
            <span
              data-testid="bag-quantity"
              aria-live="polite"
              className="label grid h-9 min-w-9 place-items-center border-x border-bone/20 px-2 text-bone"
            >
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => increment(line.key)}
              aria-label={`Increase quantity of ${line.product.name}, size ${line.size}`}
              className="grid h-9 w-9 place-items-center text-bone/80 transition-colors duration-300 hover:bg-bone/10 hover:text-acid"
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>

          <span className="label text-bone/45">
            {layout === "drawer" ? "Demonstration item" : "Demonstration item"}
          </span>
        </div>
      </div>
    </li>
  );
}
