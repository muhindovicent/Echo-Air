import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type Grade = "duotone" | "mono" | "none";

type ConceptFigureProps = {
  src: string;
  alt: string;
  /** CSS aspect-ratio value, e.g. "3 / 4". */
  ratio: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  /** Label rendered on the frame to mark non-brand imagery. */
  tag?: string;
  /**
   * Colour treatment applied to placeholder imagery so every frame reads as
   * one campaign: monochrome base with an acid-green duotone wash.
   */
  grade?: Grade;
  /** CSS `object-position` — used to crop out third-party marks in the art. */
  focus?: string;
  /** Scale factor used to crop into the source frame. */
  zoom?: number;
};

const gradeFilter: Record<Grade, string> = {
  duotone: "grayscale contrast-[1.15] brightness-[0.88]",
  mono: "grayscale contrast-[1.1] brightness-[0.92]",
  none: "",
};

/**
 * A framed image with a fixed aspect ratio (no layout shift) and a visible
 * "Concept" tag, because every photograph on the site is placeholder art
 * until the studio delivers real campaign photography.
 */
export function ConceptFigure({
  src,
  alt,
  ratio,
  sizes,
  priority = false,
  className,
  imageClassName,
  tag = "Concept",
  grade = "duotone",
  focus = "50% 50%",
  zoom = 1,
}: ConceptFigureProps) {
  const mediaStyle = {
    "--media-zoom": zoom,
    "--media-focus": focus,
  } as CSSProperties;

  return (
    <figure
      className={cn(
        "group relative isolate overflow-hidden bg-obsidian-soft",
        className,
      )}
      style={{ aspectRatio: ratio }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        style={mediaStyle}
        className={cn(
          "concept-media object-cover",
          gradeFilter[grade],
          imageClassName,
        )}
      />

      {grade === "duotone" ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-acid opacity-[0.22] mix-blend-color"
        />
      ) : null}

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_0%,transparent_35%,rgba(11,13,16,0.55)_100%)]"
      />

      <figcaption
        className={cn(
          "label pointer-events-none absolute left-3 top-3 z-10 border px-2 py-1",
          "border-bone/25 bg-obsidian/70 text-bone/85 backdrop-blur-sm",
        )}
      >
        {tag}
      </figcaption>
    </figure>
  );
}
