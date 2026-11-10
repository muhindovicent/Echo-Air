import Image from "next/image";
import type { CSSProperties } from "react";
import { ActionLink } from "@/components/ui/ActionLink";
import { heroMeta, conceptImages } from "@/lib/content";

export function Hero() {
  return (
    <section
      id="top"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden border-b border-bone/12"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src={conceptImages.campaign}
          alt="Concept image: full-length streetwear silhouette photographed in hard light"
          fill
          priority
          sizes="100vw"
          style={{
            "--media-zoom": 1.04,
            "--media-focus": "50% 26%",
          } as CSSProperties}
          className="concept-media object-cover grayscale contrast-[1.25] brightness-[0.85]"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-acid opacity-[0.22] mix-blend-color"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/55 to-obsidian/70"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(120%_80%_at_18%_10%,rgba(11,13,16,0.1),rgba(11,13,16,0.88))]"
        />
      </div>

      <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-end px-5 pb-8 pt-32 md:px-10 md:pb-12 md:pt-36">
        <div className="flex items-center gap-4">
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-acid" />
          <p className="label text-bone/80">Drop 01 — concept preview</p>
        </div>

        <h1 className="mt-6 text-mega font-medium uppercase">
          <span className="block">Silence</span>
          <span className="block pl-[8vw] text-bone/70 md:pl-[10vw]">has a</span>
          <span className="text-stroke block">uniform</span>
        </h1>

        <div className="mt-10 grid gap-10 border-t border-bone/20 pt-8 md:grid-cols-12 md:gap-8">
          <p className="text-lead text-bone/75 md:col-span-6 md:col-start-1 lg:col-span-5">
            Echo &amp; Air builds heavyweight layers for the hours before and
            after the noise arrives. Drop 01 studies weight, cut and shadow —
            and nothing else.
          </p>

          <div className="flex flex-wrap items-center gap-4 md:col-span-6 md:col-start-7 md:justify-end">
            <ActionLink href="/shop">Shop the drop</ActionLink>
            <ActionLink href="#lookbook" variant="ghost">
              View lookbook
            </ActionLink>
          </div>
        </div>

        <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-bone/20 pt-6 md:grid-cols-4">
          {heroMeta.map((item) => (
            <div key={item.label}>
              <dt className="label text-ash">{item.label}</dt>
              <dd className="mt-2 text-[0.95rem] text-bone/85">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
