"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import { CategoryFilterList } from "@/components/shop/CategoryFilterList";
import { FilterPanel } from "@/components/shop/FilterPanel";
import { ProductCard } from "@/components/shop/ProductCard";
import { SortControl } from "@/components/shop/SortControl";
import {
  ALL_CATEGORIES,
  categoryCounts,
  categoryLabel,
  matchesQuery,
  sortProducts,
  type CategoryFilter,
  type Product,
  type SortOption,
} from "@/lib/products";

type ShopBrowserProps = {
  products: readonly Product[];
};

type Filters = {
  query: string;
  category: CategoryFilter;
  sort: SortOption;
};

const CATEGORY_SLUGS = [
  "outerwear",
  "knitwear",
  "jersey",
  "trousers",
  "footwear",
  "accessories",
] as const;

const SORT_VALUES = ["catalogue", "name-asc", "name-desc", "category"] as const;

/** Event used to tell the store that the query string changed locally. */
const FILTER_EVENT = "echo-air:filters";

function isCategoryFilter(value: string): value is CategoryFilter {
  return value === ALL_CATEGORIES || CATEGORY_SLUGS.includes(value as never);
}

function isSortOption(value: string): value is SortOption {
  return SORT_VALUES.includes(value as never);
}

function parseFilters(search: string): Filters {
  const params = new URLSearchParams(search);
  const query = params.get("q") ?? "";
  const category = params.get("category") ?? ALL_CATEGORIES;
  const sort = params.get("sort") ?? "catalogue";

  return {
    query,
    category: isCategoryFilter(category) ? category : ALL_CATEGORIES,
    sort: isSortOption(sort) ? sort : "catalogue",
  };
}

/**
 * The query string is the single source of truth for the catalogue filters,
 * so a view can be shared or reloaded and still open on the same result set.
 * `useSyncExternalStore` reads it without a hydration mismatch and without
 * setting state inside an effect.
 */
function useFilters(): {
  filters: Filters;
  setFilters: (next: Filters) => void;
} {
  const subscribe = useCallback((onChange: () => void) => {
    const handler = () => onChange();
    window.addEventListener("popstate", handler);
    window.addEventListener(FILTER_EVENT, handler);
    return () => {
      window.removeEventListener("popstate", handler);
      window.removeEventListener(FILTER_EVENT, handler);
    };
  }, []);

  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );

  const filters = useMemo(() => parseFilters(search), [search]);

  const setFilters = useCallback(
    (next: Filters) => {
      const params = new URLSearchParams();
      if (next.query.trim()) params.set("q", next.query.trim());
      if (next.category !== ALL_CATEGORIES) {
        params.set("category", next.category);
      }
      if (next.sort !== "catalogue") params.set("sort", next.sort);

      const query = params.toString();
      window.history.replaceState(null, "", query ? `/shop?${query}` : "/shop");
      window.dispatchEvent(new Event(FILTER_EVENT));
    },
    [],
  );

  return { filters, setFilters };
}

/**
 * Catalogue browser: text search, category filter, sorting, active-filter
 * indicators and empty states. All filtering happens in the browser against
 * the static demonstration catalogue, so the page stays a prerendered static
 * route.
 */
export function ShopBrowser({ products }: ShopBrowserProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const { filters, setFilters } = useFilters();
  const { query, category, sort } = filters;

  const counts = useMemo(() => categoryCounts(products), [products]);

  const visible = useMemo(() => {
    const matching = products.filter(
      (product) =>
        (category === ALL_CATEGORIES || product.category === category) &&
        matchesQuery(product, query),
    );
    return sortProducts(matching, sort);
  }, [products, query, category, sort]);

  const hasFilters = query.trim().length > 0 || category !== ALL_CATEGORIES;
  const resultLabel =
    visible.length === products.length
      ? `${visible.length} pieces`
      : `${visible.length} of ${products.length} pieces`;

  const clearFilters = () => {
    setFilters({ query: "", category: ALL_CATEGORIES, sort });
  };

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-bone/12 pb-6 md:flex-row md:items-end md:justify-between">
        <div className="w-full md:max-w-sm">
          <label htmlFor="catalog-search" className="label text-ash">
            Search the catalogue
          </label>
          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(event) =>
              setFilters({ ...filters, query: event.target.value })
            }
            placeholder="Working title, category or collection"
            className="mt-3 w-full border border-bone/15 bg-obsidian-soft px-4 py-3 text-[0.95rem] text-bone placeholder:text-bone/35 transition-colors duration-300 hover:border-bone/40 focus-visible:border-acid"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <p
            role="status"
            aria-live="polite"
            data-testid="result-count"
            className="label text-bone/80"
          >
            {resultLabel}
          </p>
          <button
            type="button"
            onClick={() => setPanelOpen(true)}
            aria-controls="filter-panel"
            aria-expanded={panelOpen}
            className="label flex items-center gap-3 border border-bone/25 px-4 py-3 text-bone transition-colors duration-300 hover:border-acid hover:text-acid lg:hidden"
          >
            Filters
            {hasFilters ? (
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-acid" />
            ) : null}
          </button>
        </div>
      </div>

      {hasFilters ? (
        <div
          data-testid="active-filters"
          className="flex flex-wrap items-center gap-3 border-b border-bone/12 py-4"
        >
          <span className="label text-ash">Active</span>
          {query.trim() ? (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, query: "" })}
              className="label flex items-center gap-2 border border-acid/50 px-3 py-2 text-acid transition-colors duration-300 hover:bg-acid hover:text-obsidian"
            >
              Search: {query.trim()}
              <span aria-hidden="true">&times;</span>
              <span className="sr-only">Clear search filter</span>
            </button>
          ) : null}
          {category !== ALL_CATEGORIES ? (
            <button
              type="button"
              onClick={() => setFilters({ ...filters, category: ALL_CATEGORIES })}
              className="label flex items-center gap-2 border border-acid/50 px-3 py-2 text-acid transition-colors duration-300 hover:bg-acid hover:text-obsidian"
            >
              Category: {categoryLabel(category)}
              <span aria-hidden="true">&times;</span>
              <span className="sr-only">Clear category filter</span>
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearFilters}
            className="label text-bone/60 underline-offset-4 transition-colors duration-300 hover:text-acid hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-8">
        <aside
          aria-label="Catalogue filters"
          className="hidden lg:col-span-3 lg:block"
        >
          <div className="lg:sticky lg:top-32">
            <p className="label text-ash">Category</p>
            <div className="mt-4">
              <CategoryFilterList
                counts={counts}
                value={category}
                onChange={(value) => setFilters({ ...filters, category: value })}
                idPrefix="desktop-category"
              />
            </div>

            <div className="mt-8">
              <SortControl
                value={sort}
                onChange={(value) => setFilters({ ...filters, sort: value })}
                idPrefix="desktop"
              />
            </div>

            {hasFilters ? (
              <button
                type="button"
                onClick={clearFilters}
                className="label mt-8 w-full border border-bone/20 px-4 py-3 text-bone/70 transition-colors duration-300 hover:border-bone hover:text-bone"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        </aside>

        <div className="lg:col-span-9">
          {visible.length === 0 ? (
            <div
              data-testid="empty-state"
              className="border border-bone/12 bg-obsidian-soft px-6 py-16 text-center"
            >
              <p className="label text-acid">Nothing found</p>
              <h3 className="mt-5 text-section font-medium uppercase">
                No pieces match
                {query.trim() ? (
                  <>
                    {" "}
                    &ldquo;{query.trim()}&rdquo;
                  </>
                ) : (
                  " this filter"
                )}
              </h3>
              <p className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-bone/60">
                The catalogue is a small demonstration set. Try a shorter
                search term, pick another category, or clear the filters to see
                every piece again.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="label mt-8 inline-flex items-center gap-3 border border-bone/25 px-6 py-4 text-bone transition-colors duration-300 hover:border-acid hover:text-acid"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <ul
              data-testid="product-grid"
              className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visible.map((product, position) => (
                <li key={product.slug}>
                  <ProductCard product={product} priority={position < 3} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <FilterPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        counts={counts}
        category={category}
        onCategoryChange={(value) => {
          setFilters({ ...filters, category: value });
          setPanelOpen(false);
        }}
        sort={sort}
        onSortChange={(value) => setFilters({ ...filters, sort: value })}
        onClear={() => {
          clearFilters();
          setPanelOpen(false);
        }}
      />
    </div>
  );
}
