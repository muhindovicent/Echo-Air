"use client";

import { useCallback, useRef, useState } from "react";
import { useModalDialog } from "@/components/ui/useModalDialog";

const SIZE_GUIDE_ROWS = [
  { measurement: "Chest", value: "Not published" },
  { measurement: "Waist", value: "Not published" },
  { measurement: "Hip", value: "Not published" },
  { measurement: "Body length", value: "Not published" },
  { measurement: "Sleeve", value: "Not published" },
  { measurement: "Shoulder", value: "Not published" },
];

type SizeGuideDialogProps = {
  /** Category the guide belongs to, used in the heading. */
  category: string;
};

/**
 * Demonstration size guide.
 *
 * It deliberately publishes **no measurements**: the table shows the structure
 * a live guide would use, with every value marked as not published, because
 * no garment specifications have been confirmed.
 */
export function SizeGuideDialog({ category }: SizeGuideDialogProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useModalDialog(open, close, panelRef, { returnFocusRef: triggerRef });

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="label underline decoration-bone/40 underline-offset-4 text-bone/70 transition-colors duration-300 hover:text-acid hover:decoration-acid"
      >
        Size guide
      </button>

      {open ? (
        <div className="fixed inset-0 z-[70]">
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            onClick={close}
            className="absolute inset-0 bg-obsidian/85 backdrop-blur-sm"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="size-guide-title"
            className="absolute inset-x-0 bottom-0 max-h-[88svh] overflow-y-auto border-t border-bone/15 bg-bone text-obsidian sm:inset-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[min(34rem,92vw)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:border"
          >
            <div className="flex items-center justify-between border-b border-obsidian/15 px-5 py-4">
              <h2 id="size-guide-title" className="label">
                Size guide — {category}
              </h2>
              <button
                type="button"
                onClick={close}
                className="label border border-obsidian/25 px-4 py-3 transition-colors duration-300 hover:bg-obsidian hover:text-bone"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-6">
              <p className="text-[0.95rem] leading-relaxed text-obsidian/80">
                Garment measurements are not published for this concept build.
                The table below shows the structure a live size guide would use
                once the studio confirms the specification.
              </p>

              <table className="mt-6 w-full border-collapse text-left">
                <caption className="sr-only">
                  Demonstration size guide structure for {category}
                </caption>
                <thead>
                  <tr className="border-b border-obsidian/20">
                    <th scope="col" className="label py-3 text-obsidian/60">
                      Measurement
                    </th>
                    <th scope="col" className="label py-3 text-obsidian/60">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SIZE_GUIDE_ROWS.map((row) => (
                    <tr key={row.measurement} className="border-b border-obsidian/10">
                      <th
                        scope="row"
                        className="py-3 text-[0.95rem] font-normal text-obsidian/85"
                      >
                        {row.measurement}
                      </th>
                      <td className="py-3 text-[0.95rem] text-obsidian/60">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-6 border-l-2 border-obsidian/30 pl-4 text-[0.85rem] leading-relaxed text-obsidian/60">
                No sizing advice, fit recommendation or stock guidance is
                offered here: none has been verified for the demonstration
                pieces.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
