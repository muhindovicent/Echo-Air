import { ConceptFigure } from "@/components/ui/ConceptFigure";
import { Reveal } from "@/components/ui/Reveal";
import { conceptImages, principles } from "@/lib/content";

export function BrandStory() {
  return (
    <section
      id="studio"
      aria-labelledby="studio-heading"
      className="border-b border-bone/12 bg-obsidian"
    >
      <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="label text-acid">03 / Studio</p>
              <h2
                id="studio-heading"
                className="mt-5 text-section font-medium uppercase"
              >
                Why Echo &amp; Air
              </h2>
              <p className="mt-8 text-[clamp(1.35rem,2.4vw,2rem)] font-medium leading-[1.15] tracking-[-0.02em] text-bone">
                Streetwear built like architecture: weight, structure, and a
                silhouette that holds its shape in the dark.
              </p>
            </Reveal>

            <Reveal delay={120} className="mt-10">
              <ConceptFigure
                src={conceptImages.studio}
                alt="Concept image: cropped torso detail of a plain tee in flat light"
                ratio="4 / 5"
                sizes="(min-width: 1024px) 40vw, 100vw"
                focus="50% 45%"
                zoom={1.2}
              />
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:col-start-7">
            <Reveal delay={80}>
              <div className="space-y-6 text-[1rem] leading-relaxed text-bone/70">
                <p>
                  Echo &amp; Air is a working concept for a streetwear label
                  built around weight and structure. The house rules are simple
                  and unproven: heavier cloth, fewer seams, and silhouettes
                  that hold their shape long after a piece leaves the studio.
                </p>
                <p>
                  The visual direction follows the same logic. Campaigns should
                  be shot in the conditions the clothes are made for — concrete,
                  low light, hard shadow. If a garment only reads in a studio,
                  it was designed for the wrong room.
                </p>
                <p>
                  This site is the first frame of that idea: a homepage built on
                  type, spacing and photography, with the catalog, sizing and
                  buying flow still to come.
                </p>
              </div>
            </Reveal>

            <dl className="mt-14 border-t border-bone/12">
              {principles.map((principle, index) => (
                <Reveal key={principle.index} delay={index * 80}>
                  <div className="grid gap-3 border-b border-bone/12 py-7 md:grid-cols-12 md:gap-6">
                    <dt className="md:col-span-4">
                      <span className="label text-ash">{principle.index}</span>
                      <span className="mt-2 block text-[1.1rem] font-medium leading-snug">
                        {principle.title}
                      </span>
                    </dt>
                    <dd className="text-[0.95rem] leading-relaxed text-bone/60 md:col-span-8">
                      {principle.body}
                    </dd>
                  </div>
                </Reveal>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
