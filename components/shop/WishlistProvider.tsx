"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "echo-air:wishlist";
const EMPTY: readonly string[] = [];

type WishlistContextValue = {
  /** Saved product slugs, in the order they were added. */
  slugs: readonly string[];
  /** Number of saved pieces. */
  count: number;
  /** False until the saved list has been read from storage. */
  ready: boolean;
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readStored(): readonly string[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (value): value is string => typeof value === "string",
    );
  } catch {
    return EMPTY;
  }
}

/**
 * A tiny external store in front of `localStorage`.
 *
 * `useSyncExternalStore` reads it, so the saved list is hydrated from storage
 * without setting state inside an effect and without a hydration mismatch.
 */
let cache: readonly string[] | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): readonly string[] {
  if (cache === null) cache = readStored();
  return cache;
}

function getServerSnapshot(): readonly string[] | null {
  return null;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = readStored();
    emit();
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function write(next: readonly string[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The
    // wishlist still works for the current session.
  }
  emit();
}

/**
 * Wishlist state for the demonstration storefront.
 *
 * The list lives in React state and is mirrored to `localStorage`, so it
 * survives a reload. It stores product slugs only — no personal data and no
 * commercial state.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const slugs = stored ?? EMPTY;
  const ready = stored !== null;

  const toggle = useCallback((slug: string) => {
    const current = getSnapshot();
    write(
      current.includes(slug)
        ? current.filter((value) => value !== slug)
        : [...current, slug],
    );
  }, []);

  const remove = useCallback((slug: string) => {
    write(getSnapshot().filter((value) => value !== slug));
  }, []);

  const clear = useCallback(() => write(EMPTY), []);

  // Clear the in-memory cache when the provider unmounts so a later mount
  // reads the current value from storage.
  useEffect(() => {
    return () => {
      cache = null;
    };
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      slugs,
      count: slugs.length,
      ready,
      has: (slug: string) => slugs.includes(slug),
      toggle,
      remove,
      clear,
    }),
    [slugs, ready, toggle, remove, clear],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used inside a WishlistProvider");
  }
  return context;
}
