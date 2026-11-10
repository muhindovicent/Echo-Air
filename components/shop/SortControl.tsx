"use client";

import { cn } from "@/lib/cn";
import { SORT_OPTIONS, type SortOption } from "@/lib/products";

type SortControlProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
  idPrefix: string;
  /** Surface the control sits on. */
  tone?: "dark" | "light";
};

/** Native select so sorting works with keyboard, screen readers and no JS. */
export function SortControl({
  value,
  onChange,
  idPrefix,
  tone = "dark",
}: SortControlProps) {
  const id = `${idPrefix}-sort`;

  return (
    <div>
      <label
        htmlFor={id}
        className={cn("label", tone === "light" ? "text-ink-soft" : "text-ash")}
      >
        Sort by
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as SortOption)}
        className={cn(
          "mt-3 w-full appearance-none border px-4 py-3 text-[0.95rem] transition-colors duration-300 focus-visible:border-acid",
          tone === "light"
            ? "border-obsidian/25 bg-obsidian text-bone hover:border-obsidian"
            : "border-bone/15 bg-obsidian text-bone hover:border-bone/40",
        )}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} className="bg-obsidian">
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
