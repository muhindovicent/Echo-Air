import Link from "next/link";
import { Reveal } from "@/components/ui/Reveal";

export function ClosingBand() {
  return (
    <section aria-labelledby="closing-heading" className="bg-acid text-obsidian">
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-10 md:py-24">
        <Reveal>
          <p className="label text-obsidian/60">Phase 01 — Foundation</p>
          <h2
            id="closing-heading"
            className="mt-6 text-[clamp(2rem,6vw,5rem)] font-medium uppercase leading-[0.92] tracking-[-0.035em]"
          >
            Nothing here can be
            <span className="block">bought yet.</span>
          </h2>
          <div className="mt-10 grid gap-8 border-t border-obsidian/20 pt-8 md:grid-cols-12">
            <p className="max-w-xl text-[1rem] leading-relaxed text-obsidian/75 md:col-span-6">
              Drop 01 opens once real campaign photography replaces the concept
              art and a commerce provider is connected. Until then this build
              is a design foundation: homepage, design system and reusable
              components.
            </p>
            <div className="flex flex-wrap items-center gap-4 md:col-span-5 md:col-start-8 md:justify-end">
              <Link
                href="#new-arrivals"
                className="label group inline-flex items-center gap-3 border border-obsidian bg-obsidian px-6 py-4 text-bone transition-colors duration-300 hover:bg-transparent hover:text-obsidian"
              >
                Back to the drop
                <span
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1"
                >
                  &rarr;
                </span>
              </Link>
              <Link
                href="#studio"
                className="label inline-flex items-center gap-3 border border-obsidian/30 px-6 py-4 transition-colors duration-300 hover:border-obsidian"
              >
                Read the studio notes
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
