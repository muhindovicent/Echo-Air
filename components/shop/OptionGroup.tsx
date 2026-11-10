"use client";

import { cn } from "@/lib/cn";

export type Option = {
  id: string;
  label: string;
  /** Optional swatch colour for colourway selectors. */
  swatch?: string;
};

type OptionGroupProps = {
  /** Legend of the group, e.g. "Size — demonstration only". */
  legend: string;
  /** Shared name for the radio group. */
  name: string;
  options: readonly Option[];
  value: string;
  onChange: (id: string) => void;
  /** Hint rendered under the group. */
  hint?: string;
  className?: string;
};

/**
 * Reusable single-select group built on real radio inputs, so keyboard
 * behaviour (arrow keys, space), form semantics and screen-reader
 * announcements come from the platform rather than a custom widget.
 *
 * The options are demonstration variants: the group never implies stock,
 * availability or a purchasable combination.
 */
export function OptionGroup({
  legend,
  name,
  options,
  value,
  onChange,
  hint,
  className,
}: OptionGroupProps) {
  const legendId = `${name}-legend`;

  return (
    <fieldset
      role="radiogroup"
      aria-labelledby={legendId}
      className={cn("min-w-0", className)}
    >
      <legend id={legendId} className="label text-ash">
        {legend}
      </legend>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.id;
          return (
            <label
              key={option.id}
              className={cn(
                "group relative flex cursor-pointer items-center gap-2 border px-4 py-3 text-[0.9rem] transition-colors duration-300",
                selected
                  ? "border-acid bg-acid text-obsidian"
                  : "border-bone/20 text-bone/80 hover:border-bone/50 hover:text-bone",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={selected}
                onChange={() => onChange(option.id)}
                className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              {option.swatch ? (
                <span
                  aria-hidden="true"
                  className="h-3.5 w-3.5 rounded-full border border-obsidian/40"
                  style={{ backgroundColor: option.swatch }}
                />
              ) : null}
              <span className="peer-focus-visible:underline peer-focus-visible:decoration-acid peer-focus-visible:underline-offset-4">
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
      {hint ? (
        <p className="mt-3 text-[0.8rem] leading-relaxed text-bone/45">{hint}</p>
      ) : null}
    </fieldset>
  );
}
