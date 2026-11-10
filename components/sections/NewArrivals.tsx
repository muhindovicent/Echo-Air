import Image from "next/image";
import type { CSSProperties } from "react";
import { ConceptFigure } from "@/components/ui/ConceptFigure";
import { Reveal } from "@/components/ui/Reveal";
import { arrivals, featuredArrival } from "@/lib/content";

export function NewArrivals() {
  return (
    <section
      id="new-arrivals"
      aria-labelledby="new-arrivals-heading"
      className="border-b border-bone/12 bg-obsidian"
    >
      <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
        <div className="grid gap-8 border-b border-bone/12 pb-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <p className="label text-acid">01 / New arrivals</p>
            <h2
              id="new-arrivals-heading"
              className="mt-5 text-display font-medium uppercase"
            >
              First contact
            </h2>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <p className="text-lead text-bone/70">
              Five pieces open the drop. Weight and proportion lead; hardware
              stays out of the frame.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-12 md:mt-16 lg:grid-cols-12 lg:gap-10">
          <Reveal className="lg:col-span-6">
            <article>
              <ConceptFigure
                src={featuredArrival.image}
                alt={featuredArrival.imageAlt}
                ratio="4 / 5"
                sizes="(min-width: 1024px) 46vw, (min-width: 768px) 60vw, 100vw"
                priority={false}
                focus={featuredArrival.focus}
                zoom={featuredArrival.zoom}
              />
              <div className="mt-6 grid gap-4 md:grid-cols-12">
                <p className="label text-ash md:col-span-3">{featuredArrival.index}</p>
                <div className="md:col-span-9">
                  <h3 className="text-[clamp(1.35rem,2.2vw,1.9rem)] font-medium leading-tight tracking-[-0.02em]">
                    {featuredArrival.name}
                  </h3>
                  <p className="label mt-3 text-acid">{featuredArrival.category}</p>
                  <p className="mt-4 max-w-xl text-[0.95rem] leading-relaxed text-bone/65">
                    {featuredArrival.detail}
                  </p>
                </div>
              </div>
            </article>
          </Reveal>

          <Reveal className="lg:col-span-5 lg:col-start-8" delay={120}>
            <ul className="border-t border-bone/12">
              {arrivals.map((arrival) => (
                <li
                  key={arrival.index}
                  className="group border-b border-bone/12 transition-colors duration-500 hover:border-bone/30"
                >
                  <div className="flex items-center gap-4 py-5 md:gap-6">
                    <span className="label w-6 shrink-0 text-ash">
                      {arrival.index}
                    </span>
                    <div
                      className="relative hidden h-16 w-14 shrink-0 overflow-hidden bg-obsidian-soft sm:block"
                      aria-hidden="true"
                    >
                      <Image
                        src={arrival.image}
                        alt=""
                        fill
                        sizes="56px"
                        style={{
                          "--media-zoom": arrival.zoom,
                          "--media-focus": arrival.focus,
                        } as CSSProperties}
                        className="concept-media object-cover grayscale contrast-[1.15] brightness-[0.9]"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[1.05rem] font-medium leading-snug transition-colors duration-300 group-hover:text-acid">
                        {arrival.name}
                      </h3>
                      <p className="label mt-2 text-ash">{arrival.category}</p>
                    </div>
                    <p className="hidden max-w-[12rem] text-right text-[0.85rem] leading-relaxed text-bone/50 md:block">
                      {arrival.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-8 border-l-2 border-acid/60 pl-4 text-[0.85rem] leading-relaxed text-bone/55">
              Sizing, stock and pricing arrive with the commerce phase. This is
              a preview list — nothing here can be ordered yet.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
