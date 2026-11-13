"use client";

import Image from "next/image";
import Link from "next/link";
import { useBag } from "@/components/shop/BagProvider";
import { MAX_QUANTITY, MIN_QUANTITY, type BagLine } from "@/lib/bag";
import { cn } from "@/lib/cn";

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

  const atMaximum = line.quantity >= MAX_QUANTITY;
  const atMinimum = line.quantity <= MIN_QUANTITY;

  return (
    <li
      data-testid="bag-line"
      data-key={line.key}
      className="flex gap-3 border-b border-bone/12 py-5 first:pt-0 last:border-b-0 sm:gap-4"
    >
      <Link
        href={`/shop/${line.product.slug}`}
        className="relative block h-20 w-16 shrink-0 overflow-hidden bg-obsidian-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acid sm:h-24 sm:w-20"
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          <div className="min-w-0">
            <Link
              href={`/shop/${line.product.slug}`}
              className="text-[0.95rem] font-medium leading-snug transition-colors duration-300 hover:text-acid sm:text-[1rem]"
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
            className="label -my-1 inline-flex min-h-8 w-fit shrink-0 items-center text-bone/50 underline-offset-4 transition-colors duration-300 hover:text-acid hover:underline"
          >
            Remove
            <span className="sr-only"> {line.product.name} from the bag</span>
          </button>
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-4 sm:gap-4">
          <div className="flex items-center border border-bone/20">
            <button
              type="button"
              onClick={() => decrement(line.key)}
              aria-label={`Decrease quantity of ${line.product.name}, size ${line.size}${
                atMinimum ? " (removes the line)" : ""
              }`}
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
              disabled={atMaximum}
              aria-label={`Increase quantity of ${line.product.name}, size ${line.size}`}
              className={cn(
                "grid h-9 w-9 place-items-center text-bone/80 transition-colors duration-300 hover:bg-bone/10 hover:text-acid",
                atMaximum &&
                  "cursor-not-allowed opacity-35 hover:bg-transparent hover:text-bone/80",
              )}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>

          <span className="label hidden text-bone/45 sm:inline">
            {layout === "drawer" ? "Demonstration item" : "Demonstration selection"}
          </span>
        </div>
      </div>
    </li>
  );
}
