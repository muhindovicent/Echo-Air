"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { useModalDialog } from "@/components/ui/useModalDialog";
import type { ProductView } from "@/lib/products";
import { cn } from "@/lib/cn";

type ProductGalleryProps = {
  views: readonly ProductView[];
  productName: string;
  sizes?: string;
};

/**
 * Interactive product gallery.
 *
 * - The stage shows one frame at a time and cross-fades between frames.
 * - A thumbnail rail (only when the product has more than one frame) switches
 *   the frame with a click, `Enter`/`Space` or the arrow keys.
 * - The stage itself is focusable and responds to `ArrowLeft` / `ArrowRight`.
 * - The zoom button opens a full-screen view with the same keyboard controls;
 *   `Escape` closes it and focus returns to the button that opened it.
 *
 * A product with a single frame renders a plain frame with no switching
 * controls, so a single-image product never pretends to have alternatives.
 */
export function ProductGallery({
  views,
  productName,
  sizes = "(min-width: 1024px) 38vw, 92vw",
}: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const zoomButtonRef = useRef<HTMLButtonElement>(null);
  const zoomPanelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const multiple = views.length > 1;
  // Clamp at read time so the index can never point past the last frame.
  const index = Math.min(activeIndex, Math.max(views.length - 1, 0));
  const active = views[index] ?? views[0];

  const closeZoom = useCallback(() => setZoomOpen(false), []);
  useModalDialog(zoomOpen, closeZoom, zoomPanelRef, {
    returnFocusRef: zoomButtonRef,
  });

  const select = (next: number) => {
    setActiveIndex(next);
  };

  const step = (direction: 1 | -1) => {
    if (!multiple) return;
    const next = (index + direction + views.length) % views.length;
    setActiveIndex(next);
  };

  const onStageKeyDown = (event: React.KeyboardEvent) => {
    if (!multiple) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    }
  };

  const onThumbnailKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = (index + direction + views.length) % views.length;
      setActiveIndex(next);
      const buttons = event.currentTarget
        .closest("[data-gallery-rail]")
        ?.querySelectorAll<HTMLButtonElement>("button");
      buttons?.[next]?.focus();
    }
  };

  if (!active) return null;

  return (
    <div className="relative">
      <div
        ref={stageRef}
        tabIndex={multiple ? 0 : -1}
        role={multiple ? "group" : undefined}
        data-testid="gallery-stage"
        data-views={views.length}
        aria-label={
          multiple
            ? `${productName} gallery. Frame ${index + 1} of ${views.length}. Use the arrow keys to change frame.`
            : undefined
        }
        onKeyDown={onStageKeyDown}
        className={cn(
          "group relative overflow-hidden bg-obsidian-soft outline-offset-4",
          multiple && "focus-visible:outline-2 focus-visible:outline-acid",
        )}
        style={{ aspectRatio: "4 / 5" }}
      >
        <Image
          key={active.id}
          src={active.src}
          alt={active.alt}
          fill
          priority
          sizes={sizes}
          className="gallery-frame-in object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
        />

        {/* Cinematic light: a soft key light from the upper left and a deep
            vignette that keeps the frame anchored in the dark layout. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_70%_at_22%_12%,rgba(245,245,240,0.14),transparent_60%)]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_40%,rgba(11,13,16,0.6)_100%)]"
        />

        <span className="label pointer-events-none absolute left-3 top-3 z-10 border border-bone/25 bg-obsidian/70 px-2 py-1 text-bone/85 backdrop-blur-sm">
          Concept
        </span>

        {multiple ? (
          <span className="label pointer-events-none absolute right-3 top-3 z-10 border border-bone/25 bg-obsidian/70 px-2 py-1 text-bone/85 backdrop-blur-sm">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(views.length).padStart(2, "0")}
          </span>
        ) : null}

        <button
          ref={zoomButtonRef}
          type="button"
          onClick={() => setZoomOpen(true)}
          aria-haspopup="dialog"
          data-testid="gallery-zoom"
          className="label absolute bottom-3 right-3 z-10 flex items-center gap-2 border border-bone/30 bg-obsidian/75 px-3 py-2 text-bone backdrop-blur-sm transition-colors duration-300 hover:border-acid hover:text-acid"
        >
          <span aria-hidden="true">⤢</span>
          Zoom
        </button>

        <span className="label pointer-events-none absolute bottom-3 left-3 z-10 text-bone/60">
          {active.label}
        </span>
      </div>

      {multiple ? (
        <div
          data-gallery-rail
          role="group"
          aria-label={`${productName} frames`}
          className="mt-4 flex gap-3 overflow-x-auto pb-1"
        >
          {views.map((view, position) => (
            <button
              key={view.id}
              type="button"
              onClick={() => select(position)}
              onKeyDown={(event) => onThumbnailKeyDown(event, position)}
              aria-pressed={position === index}
              aria-label={`Show ${view.label.toLowerCase()}, frame ${position + 1} of ${views.length}`}
              className={cn(
                "group relative h-20 w-16 shrink-0 overflow-hidden border transition-colors duration-300 md:h-24 md:w-20",
                position === index
                  ? "border-acid"
                  : "border-bone/15 hover:border-bone/50",
              )}
            >
              <Image
                src={view.src}
                alt=""
                fill
                sizes="80px"
                className="object-cover opacity-70 grayscale transition-opacity duration-500 group-hover:opacity-100"
              />
            </button>
          ))}
        </div>
      ) : null}

      {zoomOpen ? (
        <div className="fixed inset-0 z-[70]">
          <div
            ref={zoomPanelRef}
            role="dialog"
            aria-modal="true"
            aria-label={`${productName} — enlarged view`}
            onKeyDown={(event) => {
              if (!multiple) return;
              if (event.key === "ArrowRight") {
                event.preventDefault();
                step(1);
              }
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                step(-1);
              }
            }}
            className="absolute inset-0 flex flex-col bg-obsidian/97 backdrop-blur-md"
          >
            <div className="flex items-center justify-between border-b border-bone/12 px-5 py-4">
              <p className="label text-bone/70">
                {productName} — {active.label}
                {multiple
                  ? ` · ${String(index + 1).padStart(2, "0")} / ${String(views.length).padStart(2, "0")}`
                  : ""}
              </p>
              <button
                type="button"
                onClick={closeZoom}
                className="label border border-bone/25 px-4 py-3 text-bone transition-colors duration-300 hover:border-acid hover:text-acid"
              >
                Close
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden bg-obsidian">
              <Image
                key={active.id}
                src={active.src}
                alt={active.alt}
                fill
                sizes="100vw"
                className="gallery-frame-in object-cover"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_30%_15%,rgba(245,245,240,0.12),transparent_65%)]"
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_45%,rgba(11,13,16,0.55)_100%)]"
              />
              <span className="label pointer-events-none absolute left-5 top-5 border border-bone/25 bg-obsidian/70 px-2 py-1 text-bone/85 backdrop-blur-sm">
                Concept
              </span>
            </div>

            {multiple ? (
              <div className="flex items-center justify-between border-t border-bone/12 px-5 py-4">
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="label border border-bone/25 px-4 py-3 text-bone transition-colors duration-300 hover:border-acid hover:text-acid"
                >
                  <span aria-hidden="true">←</span> Previous
                </button>
                <p className="label text-ash">Arrow keys change frame</p>
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="label border border-bone/25 px-4 py-3 text-bone transition-colors duration-300 hover:border-acid hover:text-acid"
                >
                  Next <span aria-hidden="true">→</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
