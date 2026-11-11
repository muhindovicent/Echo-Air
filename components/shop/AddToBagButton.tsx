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

type AddState = "idle" | "adding" | "added";

/**
 * Adds the current demonstration selection to the demo bag.
 *
 * The button shows a short pending state so the interaction is visible, then
 * confirms that the piece was added. Nothing is ordered or reserved.
 */
export function AddToBagButton({
  slug,
  size,
  colour,
  className,
}: AddToBagButtonProps) {
  const { add } = useBag();
  const [state, setState] = useState<AddState>("idle");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const onClick = useCallback(() => {
    setState("adding");
    setMessage("Adding to the demo bag");

    timer.current = setTimeout(() => {
      add({ slug, size, colour, quantity: 1 });
      setState("added");
      setMessage("Added to the demo bag");

      timer.current = setTimeout(() => {
        setState("idle");
        setMessage("");
      }, 2000);
    }, 350);
  }, [add, slug, size, colour]);

  const label =
    state === "adding"
      ? "Adding…"
      : state === "added"
        ? "Added to demo bag"
        : "Add to Demo Bag";

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        disabled={state === "adding"}
        data-testid="add-to-bag"
        data-state={state}
        aria-describedby="add-to-bag-note"
        className={cn(
          "label inline-flex items-center gap-3 border px-6 py-4 transition-colors duration-300",
          state === "added"
            ? "border-acid bg-acid text-obsidian"
            : "border-acid bg-acid text-obsidian hover:bg-bone hover:border-bone",
          state === "adding" && "cursor-wait opacity-80",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block h-2 w-2 rounded-full bg-obsidian",
            state === "adding" && "animate-pulse",
          )}
        />
        {label}
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
