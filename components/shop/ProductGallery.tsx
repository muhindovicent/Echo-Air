"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useModalDialog } from "@/components/ui/useModalDialog";
import type { ProductView } from "@/lib/products";
import { cn } from "@/lib/cn";

type ProductGalleryProps = {
  views: readonly ProductView[];
  productName: string;
  sizes?: string;
};

type SourceSize = { width: number; height: number };

/**
 * A frame can only be zoomed into when the source carries at least twice the
 * pixels of the area it is shown in. Below that, zooming would only stretch
 * the pixels, so the full-screen view offers no zoom control instead.
 */
function supportsZoom(
  source: SourceSize | null,
  viewport: SourceSize | null,
): boolean {
  if (!source || !viewport) return false;
  return (
    source.width >= viewport.width * 2 && source.height >= viewport.height * 2
  );
}

/**
 * Interactive product gallery.
 *
 * - The stage shows one frame at a time and cross-fades between frames.
 * - A thumbnail rail (only when the product has more than one frame) switches
 *   the frame with a click, `Enter`/`Space` or the arrow keys.
 * - The stage itself is focusable and responds to `ArrowLeft` / `ArrowRight`.
 * - The "Full screen" button opens the complete frame, letterboxed at its own
 *   resolution so it is never blown up or cropped. A zoom control only
 *   appears when the source resolution can support it, and `Escape` closes
 *   the view and returns focus to the button that opened it.
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
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [source, setSource] = useState<SourceSize | null>(null);
  const [viewport, setViewport] = useState<SourceSize | null>(null);
  const [measured, setMeasured] = useState(false);
  const zoomButtonRef = useRef<HTMLButtonElement>(null);
  const zoomPanelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const stageImageRef = useRef<HTMLImageElement | null>(null);
  const fullscreenAreaRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const multiple = views.length > 1;
  // Clamp at read time so the index can never point past the last frame.
  const index = Math.min(activeIndex, Math.max(views.length - 1, 0));
  const active = views[index] ?? views[0];

  const closeZoom = useCallback(() => {
    setZoomOpen(false);
    setZoomed(false);
    setOrigin({ x: 50, y: 50 });
  }, []);
  useModalDialog(zoomOpen, closeZoom, zoomPanelRef, {
    returnFocusRef: zoomButtonRef,
  });

  /**
   * Reads the real pixel size of the frame that is on screen. A callback ref
   * is used instead of the load event because a cached image can finish
   * before the handler is attached.
   */
  const measureFullscreenImage = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node) return;

      const read = () => {
        if (node.naturalWidth > 0) {
          setSource({
            width: node.naturalWidth,
            height: node.naturalHeight,
          });
          setMeasured(true);
        }
      };

      read();
      if (!node.complete) {
        node.addEventListener("load", read, { once: true });
      }
    },
    [],
  );

  // Measure the area the frame is shown in, so the frame can be fitted to it
  // and the zoom capability decided against the space it actually gets.
  useEffect(() => {
    if (!zoomOpen) return;

    const area = fullscreenAreaRef.current;
    if (!area) return;

    const measure = () =>
      setViewport({ width: area.clientWidth, height: area.clientHeight });

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(area);
    window.addEventListener("resize", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [zoomOpen]);

  // Never upscale: the frame is shown at its own resolution, scaled down only
  // when the viewport is smaller.
  const fit = (() => {
    if (!source || !viewport) return null;
    const scale = Math.min(
      viewport.width / source.width,
      viewport.height / source.height,
      1,
    );
    return {
      width: Math.round(source.width * scale),
      height: Math.round(source.height * scale),
      scale,
    };
  })();

  const canZoom = supportsZoom(source, viewport);

  const select = (next: number) => {
    setMeasured(false);
    setActiveIndex(next);
  };

  const step = (direction: 1 | -1) => {
    if (!multiple) return;
    const next = (index + direction + views.length) % views.length;
    setMeasured(false);
    setActiveIndex(next);
  };

  const pan = (dx: number, dy: number) => {
    setOrigin((current) => ({
      x: Math.min(100, Math.max(0, current.x + dx)),
      y: Math.min(100, Math.max(0, current.y + dy)),
    }));
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
    position: number,
  ) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = (position + direction + views.length) % views.length;
      setActiveIndex(next);
      const buttons = event.currentTarget
        .closest("[data-gallery-rail]")
        ?.querySelectorAll<HTMLButtonElement>("button");
      buttons?.[next]?.focus();
    }
  };

  const onZoomKeyDown = (event: React.KeyboardEvent) => {
    if (zoomed && canZoom) {
      const stepSize = 6;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        pan(-stepSize, 0);
        return;
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        pan(stepSize, 0);
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        pan(0, -stepSize);
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        pan(0, stepSize);
        return;
      }
    }

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
          ref={stageImageRef}
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
          onClick={() => {
            // The stage already holds the frame at its own resolution, so the
            // full-screen view can be fitted before the larger rendition has
            // finished loading.
            const image = stageImageRef.current;
            if (image && image.naturalWidth > 0) {
              setSource({ width: image.naturalWidth, height: image.naturalHeight });
            }
            setMeasured(false);
            setZoomOpen(true);
          }}
          aria-haspopup="dialog"
          data-testid="gallery-zoom"
          className="label absolute bottom-3 right-3 z-10 flex items-center gap-2 border border-bone/30 bg-obsidian/75 px-3 py-2 text-bone backdrop-blur-sm transition-colors duration-300 hover:border-acid hover:text-acid"
        >
          <span aria-hidden="true">⤢</span>
          Full screen
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
            aria-label={`${productName} — full screen view`}
            onKeyDown={onZoomKeyDown}
            className="absolute inset-0 flex flex-col bg-obsidian"
          >
            <div className="flex items-center justify-between gap-4 border-b border-bone/12 px-5 py-4">
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

            <div
              data-testid="gallery-fullscreen"
              ref={fullscreenAreaRef}
              className="relative flex-1 overflow-hidden bg-obsidian"
              onPointerDown={(event) => {
                if (!zoomed || !canZoom) return;
                dragRef.current = { x: event.clientX, y: event.clientY };
              }}
              onPointerMove={(event) => {
                if (!dragRef.current || !zoomed || !canZoom) return;
                const deltaX = event.clientX - dragRef.current.x;
                const deltaY = event.clientY - dragRef.current.y;
                dragRef.current = { x: event.clientX, y: event.clientY };
                pan(-deltaX * 0.4, -deltaY * 0.4);
              }}
              onPointerUp={() => {
                dragRef.current = null;
              }}
              onPointerLeave={() => {
                dragRef.current = null;
              }}
            >
              {zoomed && canZoom ? (
                <div
                  data-testid="gallery-zoomed"
                  className="absolute inset-0 transition-transform duration-200"
                  style={{
                    transform: "scale(2)",
                    transformOrigin: `${origin.x}% ${origin.y}%`,
                  }}
                >
                  <Image
                    src={active.src}
                    alt={active.alt}
                    fill
                    sizes="100vw"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 grid place-items-center p-4 md:p-8">
                  <div
                    data-testid="gallery-contain"
                    className={cn(
                      "relative border border-bone/15 shadow-[0_0_60px_rgba(0,0,0,0.6)] transition-opacity duration-300",
                      !measured && "opacity-0",
                    )}
                    style={
                      fit
                        ? { width: fit.width, height: fit.height }
                        : { width: "100%", height: "100%" }
                    }
                  >
                    <Image
                      key={active.id}
                      ref={measureFullscreenImage}
                      src={active.src}
                      alt={active.alt}
                      fill
                      sizes="100vw"
                      className="gallery-frame-in object-contain"
                    />
                  </div>
                </div>
              )}

              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_45%,rgba(11,13,16,0.5)_100%)]"
              />
              <span className="label pointer-events-none absolute left-5 top-5 border border-bone/25 bg-obsidian/70 px-2 py-1 text-bone/85 backdrop-blur-sm">
                Concept
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-bone/12 px-5 py-4">
              {multiple ? (
                <button
                  type="button"
                  onClick={() => step(-1)}
                  className="label border border-bone/25 px-4 py-3 text-bone transition-colors duration-300 hover:border-acid hover:text-acid"
                >
                  <span aria-hidden="true">←</span> Previous
                </button>
              ) : (
                <span />
              )}

              <div className="flex flex-col items-center gap-2 text-center">
                {zoomed && canZoom ? (
                  <p className="label text-ash">
                    Zoomed 2× — arrow keys or drag to pan
                  </p>
                ) : canZoom ? (
                  <p className="label text-ash">
                    Source resolution supports zooming
                  </p>
                ) : (
                  <p className="label text-ash">
                    {source && viewport && source.width < viewport.width
                      ? "Source resolution is lower than this display — the frame is shown at its own size"
                      : "Complete frame — the source does not support zooming"}
                  </p>
                )}

                {canZoom ? (
                  <button
                    type="button"
                    data-testid="gallery-zoom-toggle"
                    aria-pressed={zoomed}
                    onClick={() => {
                      setZoomed((current) => !current);
                      setOrigin({ x: 50, y: 50 });
                    }}
                    className="label border border-bone/25 px-4 py-2 text-bone transition-colors duration-300 hover:border-acid hover:text-acid"
                  >
                    {zoomed ? "Zoom out" : "Zoom in"}
                  </button>
                ) : null}
              </div>

              {multiple ? (
                <button
                  type="button"
                  onClick={() => step(1)}
                  className="label border border-bone/25 px-4 py-3 text-bone transition-colors duration-300 hover:border-acid hover:text-acid"
                >
                  Next <span aria-hidden="true">→</span>
                </button>
              ) : (
                <span />
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
