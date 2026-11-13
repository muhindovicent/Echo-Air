"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useBag } from "@/components/shop/BagProvider";
import { cn } from "@/lib/cn";

type AddToBagButtonProps = {
  slug: string;
  size: string;
  colour: string;
  className?: string;
};

/** How long the confirmation stays visible before the button returns to idle. */
const CONFIRMATION_MS = 2000;

/**
 * Adds the current demonstration selection to the demo bag.
 *
 * The item is added **synchronously**, so navigating away or unmounting the
 * button straight after the click can never cancel it. The button then shows a
 * short confirmation, announced in a live region, and returns to its idle
 * label. Nothing is ordered or reserved.
 */
export function AddToBagButton({
  slug,
  size,
  colour,
  className,
}: AddToBagButtonProps) {
  const { add } = useBag();
  const [added, setAdded] = useState(false);
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A single timer is ever in flight, and it is cleared on unmount.
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onClick = useCallback(() => {
    add({ slug, size, colour, quantity: 1 });

    setAdded(true);
    setMessage("Added to the demo bag");

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      setAdded(false);
      setMessage("");
    }, CONFIRMATION_MS);
  }, [add, slug, size, colour]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        data-testid="add-to-bag"
        data-state={added ? "added" : "idle"}
        aria-describedby="add-to-bag-note"
        className={cn(
          "label inline-flex items-center gap-3 border px-6 py-4 transition-colors duration-300",
          added
            ? "border-bone bg-bone text-obsidian"
            : "border-acid bg-acid text-obsidian hover:bg-bone hover:border-bone",
        )}
      >
        <span aria-hidden="true" className="text-[1rem] leading-none">
          {added ? "✓" : "+"}
        </span>
        {added ? "Added to demo bag" : "Add to Demo Bag"}
      </button>

      <p id="add-to-bag-note" className="sr-only">
        Adds this demonstration piece with the selected size and colour label to
        the demo bag. Nothing is ordered or reserved.
      </p>

      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}
