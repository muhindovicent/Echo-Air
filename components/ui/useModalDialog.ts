"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

type ModalDialogOptions = {
  /** Element that receives focus when the dialog opens. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Element that receives focus again when the dialog closes. */
  returnFocusRef?: RefObject<HTMLElement | null>;
};

/**
 * Shared behaviour for the modal surfaces (mobile navigation, mobile filter
 * panel): moves focus into the panel, keeps `Tab` inside it, closes on
 * `Escape`, locks background scrolling and restores focus to the control that
 * opened the dialog when it closes.
 */
export function useModalDialog(
  open: boolean,
  onClose: () => void,
  panelRef: RefObject<HTMLElement | null>,
  { initialFocusRef, returnFocusRef }: ModalDialogOptions = {},
) {
  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    // Captured while the dialog is open so the cleanup restores focus to the
    // element that is still mounted at that point.
    const returnTarget = returnFocusRef?.current ?? null;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (initialFocusRef?.current ?? firstFocusable)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;

      // Give focus back to the control that opened the dialog. Falling back
      // to the previously focused element keeps the behaviour correct when
      // the opener is not known.
      const target = returnTarget ?? previouslyFocused;
      if (target && document.contains(target)) {
        target.focus();
      } else {
        previouslyFocused?.focus?.();
      }
    };
  }, [open, onClose, panelRef, initialFocusRef, returnFocusRef]);
}
