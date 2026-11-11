"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { BagLineItem } from "@/components/shop/BagLineItem";
import { useBag } from "@/components/shop/BagProvider";
import { useModalDialog } from "@/components/ui/useModalDialog";

/**
 * The demonstration bag drawer.
 *
 * It uses the shared modal contract: focus moves in, `Tab` is trapped,
 * `Escape` closes, the background scroll is locked and focus returns to the
 * control that opened it. Nothing in here prices, reserves or orders
 * anything.
 */
export function BagDrawer() {
  const { lines, count, drawerOpen, closeDrawer, clear, ready } = useBag();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleClose = useCallback(() => closeDrawer(), [closeDrawer]);

  useModalDialog(drawerOpen, handleClose, panelRef, {
    initialFocusRef: closeRef,
  });

  if (!drawerOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={handleClose}
        className="absolute inset-0 bg-obsidian/80 backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        id="bag-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Demonstration bag"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-bone/15 bg-obsidian-soft shadow-[-30px_0_80px_rgba(0,0,0,0.6)]"
      >
        <div className="flex items-center justify-between border-b border-bone/12 px-5 py-4">
          <p className="label">
            Demo bag
            {ready && count > 0 ? ` — ${count}` : ""}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={handleClose}
            className="label border border-bone/25 px-4 py-3 text-bone transition-colors duration-300 hover:border-acid hover:text-acid"
          >
            Close
          </button>
        </div>

        <div className="border-b border-bone/12 bg-obsidian px-5 py-4">
          <div className="border-l-2 border-acid/70 pl-4">
            <p className="label text-acid">Demonstration only</p>
            <p className="mt-2 text-[0.85rem] leading-relaxed text-bone/70">
              This bag records the pieces you picked. There is no price, no
              stock, no delivery and no checkout — nothing here can be ordered.
            </p>
          </div>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
            <p className="label text-acid">Nothing in the bag</p>
            <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-bone/60">
              Add a piece from the catalogue and it will appear here, with the
              demonstration size and colour label you picked.
            </p>
            <Link
              href="/shop"
              onClick={handleClose}
              className="label mt-8 inline-flex items-center gap-3 border border-acid bg-acid px-6 py-4 text-obsidian transition-colors duration-300 hover:bg-bone hover:border-bone"
            >
              Browse the catalogue
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 overflow-y-auto px-5">
              {lines.map((line) => (
                <BagLineItem key={line.key} line={line} />
              ))}
            </ul>

            <div className="border-t border-bone/12 px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={clear}
                  className="label text-bone/55 underline-offset-4 transition-colors duration-300 hover:text-acid hover:underline"
                >
                  Clear bag
                </button>
                <Link
                  href="/bag"
                  onClick={handleClose}
                  className="label inline-flex items-center gap-3 border border-bone/25 px-5 py-3 text-bone transition-colors duration-300 hover:border-acid hover:text-acid"
                >
                  View full bag
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
