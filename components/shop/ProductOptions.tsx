"use client";

import { useState } from "react";
import { OptionGroup } from "@/components/shop/OptionGroup";
import {
  COLOURWAY_VARIANT_NOTE,
  DEMONSTRATION_VARIANT_NOTE,
  type ProductColour,
} from "@/lib/products";

type ProductOptionsProps = {
  slug: string;
  sizes: readonly string[];
  colours: readonly ProductColour[];
};

/**
 * Demonstration variant selectors.
 *
 * The selection is local to the page and only records which demonstration
 * variant is in view: no stock level, price, availability or order state is
 * implied or stored.
 */
export function ProductOptions({
  slug,
  sizes,
  colours,
}: ProductOptionsProps) {
  const [size, setSize] = useState(sizes[0] ?? "");
  const [colour, setColour] = useState(colours[0]?.id ?? "");

  const colourName =
    colours.find((entry) => entry.id === colour)?.name ?? colour;

  return (
    <div className="space-y-6 md:space-y-8">
      <OptionGroup
        legend="Size — demonstration only"
        name={`size-${slug}`}
        options={sizes.map((value) => ({ id: value, label: value }))}
        value={size}
        onChange={setSize}
        hint={DEMONSTRATION_VARIANT_NOTE}
      />

      <OptionGroup
        legend="Colourway label — demonstration only"
        name={`colour-${slug}`}
        options={colours.map((entry) => ({
          id: entry.id,
          label: entry.name,
          swatch: entry.swatch,
        }))}
        value={colour}
        onChange={setColour}
        hint={COLOURWAY_VARIANT_NOTE}
      />

      <p
        data-testid="selected-variants"
        className="label text-bone/55"
        aria-live="polite"
      >
        Selected — size {size}, colourway label {colourName}
      </p>
    </div>
  );
}
