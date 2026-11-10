"use client";

import { useCallback, useRef, type RefObject } from "react";
import { useModalDialog } from "@/components/ui/useModalDialog";
import { CategoryFilterList, type CategoryCount } from "@/components/shop/CategoryFilterList";
import { SortControl } from "@/components/shop/SortControl";
import type { CategoryFilter, SortOption } from "@/lib/products";

type FilterPanelProps = {
  open: boolean;
  onClose: () => void;
  counts: CategoryCount[];
  category: CategoryFilter;
  onCategoryChange: (value: CategoryFilter) => void;
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  onClear: () => void;
  /** Control that opened the panel; focus returns here when it closes. */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

/**
 * Mobile filter panel. Same dialog contract as the mobile navigation: modal
 * semantics, focus moved in, focus trapped, `Escape` to close, background
 * scrolling locked and focus returned to the button that opened it.
 *
 * The panel sits on the off-white surface, so its controls use the light
 * tone of the shared components.
 */
export function FilterPanel({
  open,
  onClose,
  counts,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  onClear,
  returnFocusRef,
}: FilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => onClose(), [onClose]);

  useModalDialog(open, handleClose, panelRef, {
    initialFocusRef: closeRef,
    returnFocusRef,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={handleClose}
        className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm"
      />
      <div
        id="filter-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Catalogue filters"
        className="absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto border-t border-obsidian/20 bg-bone text-obsidian"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-obsidian/20 bg-bone px-5 py-4">
          <p className="label">Filters</p>
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            className="label border border-obsidian/30 px-4 py-3 text-obsidian transition-colors duration-300 hover:bg-obsidian hover:text-bone"
          >
            Close
          </button>
        </div>

        <div className="space-y-8 px-5 py-6">
          <div>
            <p className="label text-ink-soft">Category</p>
            <div className="mt-3">
              <CategoryFilterList
                counts={counts}
                value={category}
                onChange={onCategoryChange}
                idPrefix="panel-category"
                layout="chips"
                tone="light"
              />
            </div>
          </div>

          <div>
            <SortControl
              value={sort}
              onChange={onSortChange}
              idPrefix="panel"
              tone="light"
            />
          </div>

          <button
            type="button"
            onClick={onClear}
            className="label w-full border border-obsidian/30 px-4 py-3 text-obsidian transition-colors duration-300 hover:bg-obsidian hover:text-bone"
          >
            Clear filters
          </button>
        </div>
      </div>
    </div>
  );
}
