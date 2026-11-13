"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  countItems,
  countLines,
  lineKey,
  MIN_QUANTITY,
  mergeEntry,
  normaliseQuantity,
  resolveLines,
  sanitiseEntries,
  type BagEntry,
  type BagLine,
} from "@/lib/bag";
import { BagDrawer } from "@/components/shop/BagDrawer";

const STORAGE_KEY = "echo-air:bag";
const EMPTY: readonly BagEntry[] = [];

type BagContextValue = {
  /** Stored entries, already validated against the demonstration catalogue. */
  entries: readonly BagEntry[];
  /** Entries resolved into displayable lines. */
  lines: readonly BagLine[];
  /** Total number of pieces in the bag. */
  count: number;
  /** Number of distinct lines. */
  lineCount: number;
  /** False until the bag has been read from storage. */
  ready: boolean;
  add: (entry: Omit<BagEntry, "quantity"> & { quantity?: number }) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  has: (key: string) => boolean;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const BagContext = createContext<BagContextValue | null>(null);

/**
 * A tiny external store in front of `localStorage`.
 *
 * `useSyncExternalStore` reads it, so the bag is hydrated from storage
 * without setting state inside an effect and without a hydration mismatch.
 */
let cache: readonly BagEntry[] | null = null;
const listeners = new Set<() => void>();

function readStored(): readonly BagEntry[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    return sanitiseEntries(JSON.parse(raw));
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): readonly BagEntry[] {
  if (cache === null) cache = readStored();
  return cache;
}

function getServerSnapshot(): readonly BagEntry[] | null {
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

function write(next: readonly BagEntry[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The bag
    // still works for the current session.
  }
  emit();
}

/**
 * Demonstration shopping bag.
 *
 * The bag is device-local and holds product identifiers, the selected
 * demonstration size and colour label, and a quantity. It is not a checkout:
 * there is no price, no total, no stock, no delivery and no payment.
 */
export function BagProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const entries = stored ?? EMPTY;
  const ready = stored !== null;

  const add = useCallback(
    (entry: Omit<BagEntry, "quantity"> & { quantity?: number }) => {
      write(
        mergeEntry(getSnapshot(), {
          slug: entry.slug,
          size: entry.size,
          colour: entry.colour,
          quantity: entry.quantity ?? 1,
        }),
      );
    },
    [],
  );

  const setQuantity = useCallback((key: string, quantity: number) => {
    const normalised = normaliseQuantity(quantity);
    if (normalised === null) return;

    write(
      getSnapshot().map((entry) =>
        lineKey(entry) === key ? { ...entry, quantity: normalised } : entry,
      ),
    );
  }, []);

  const increment = useCallback(
    (key: string) => {
      const current = getSnapshot().find((entry) => lineKey(entry) === key);
      if (!current) return;
      setQuantity(key, current.quantity + 1);
    },
    [setQuantity],
  );

  const decrement = useCallback(
    (key: string) => {
      const current = getSnapshot().find((entry) => lineKey(entry) === key);
      if (!current) return;
      if (current.quantity <= MIN_QUANTITY) {
        write(getSnapshot().filter((entry) => lineKey(entry) !== key));
        return;
      }
      setQuantity(key, current.quantity - 1);
    },
    [setQuantity],
  );

  const remove = useCallback((key: string) => {
    write(getSnapshot().filter((entry) => lineKey(entry) !== key));
  }, []);

  const clear = useCallback(() => write(EMPTY), []);

  const [drawerOpen, setDrawerOpen] = useState(false);

  const value = useMemo<BagContextValue>(
    () => ({
      entries,
      lines: resolveLines(entries),
      count: countItems(entries),
      lineCount: countLines(entries),
      ready,
      add,
      increment,
      decrement,
      setQuantity,
      remove,
      clear,
      has: (key: string) => entries.some((entry) => lineKey(entry) === key),
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    }),
    [
      entries,
      ready,
      add,
      increment,
      decrement,
      setQuantity,
      remove,
      clear,
      drawerOpen,
      setDrawerOpen,
    ],
  );

  return (
    <BagContext.Provider value={value}>
      {children}
      <BagDrawer />
    </BagContext.Provider>
  );
}

/** Access the demonstration bag from any component inside the provider. */
export function useBag(): BagContextValue {
  const context = useContext(BagContext);
  if (!context) {
    throw new Error("useBag must be used inside a BagProvider");
  }
  return context;
}
