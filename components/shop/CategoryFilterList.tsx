"use client";

import { cn } from "@/lib/cn";
import type { CategoryFilter } from "@/lib/products";

export type CategoryCount = {
  slug: CategoryFilter;
  label: string;
  count: number;
};

type CategoryFilterListProps = {
  counts: CategoryCount[];
  value: CategoryFilter;
  onChange: (value: CategoryFilter) => void;
  idPrefix: string;
  /** Stacked list in the desktop sidebar, chips in the mobile panel. */
  layout?: "stacked" | "chips";
  /**
   * Surface the control sits on. The mobile filter panel is off-white, so the
   * light tone uses obsidian text instead of the bone text used on the dark
   * pages.
   */
  tone?: "dark" | "light";
};

/**
 * Single-select category filter. Each option is a toggle button with
 * `aria-pressed`, so the current selection is announced without needing a
 * custom radio widget.
 */
export function CategoryFilterList({
  counts,
  value,
  onChange,
  idPrefix,
  layout = "stacked",
  tone = "dark",
}: CategoryFilterListProps) {
  return (
    <ul
      className={cn(
        "flex",
        layout === "chips" ? "flex-wrap gap-2" : "flex-col gap-1",
      )}
    >
      {counts.map((item) => {
        const selected = value === item.slug;
        return (
          <li key={item.slug}>
            <button
              type="button"
              id={`${idPrefix}-${item.slug}`}
              aria-pressed={selected}
              onClick={() => onChange(item.slug)}
              className={cn(
                "group flex w-full items-center justify-between gap-4 border px-4 py-3 text-left transition-colors duration-300",
                layout === "chips" && "w-auto",
                selected
                  ? tone === "light"
                    ? "border-obsidian bg-obsidian text-bone"
                    : "border-acid bg-acid text-obsidian"
                  : tone === "light"
                    ? "border-obsidian/25 text-ink hover:border-obsidian hover:text-obsidian"
                    : "border-bone/15 text-bone/75 hover:border-bone/40 hover:text-bone",
              )}
            >
              <span className="text-[0.95rem]">{item.label}</span>
              <span
                className={cn(
                  "label",
                  selected
                    ? tone === "light"
                      ? "text-bone-dim"
                      : "text-obsidian/70"
                    : tone === "light"
                      ? "text-ink-soft"
                      : "text-ash",
                )}
              >
                {item.count}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
