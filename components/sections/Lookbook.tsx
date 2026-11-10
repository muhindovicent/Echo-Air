import { ConceptFigure } from "@/components/ui/ConceptFigure";
import { Reveal } from "@/components/ui/Reveal";
import { looks } from "@/lib/content";

const placements = [
  "col-span-12 w-[92%] md:col-span-5 md:w-full md:col-start-1",
  "col-span-12 w-[80%] ml-auto md:col-span-6 md:w-full md:col-start-7 md:mt-16",
  "col-span-12 w-[78%] md:col-span-4 md:w-full md:col-start-2 md:mt-10",
  "col-span-12 w-[88%] ml-auto md:col-span-5 md:w-full md:col-start-8 md:mt-20",
];

const ratios = ["3 / 4", "4 / 5", "1 / 1", "3 / 4"];

export function Lookbook() {
  return (
    <section
      id="lookbook"
      aria-labelledby="lookbook-heading"
      className="border-b border-bone/12 bg-obsidian-soft"
    >
      <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10 md:py-28">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-6">
            <p className="label text-acid">02 / Lookbook</p>
            <h2
              id="lookbook-heading"
              className="mt-5 text-display font-medium uppercase"
            >
              Studies in shadow
            </h2>
          </div>
          <div className="md:col-span-4 md:col-start-9">
            <p className="text-lead text-bone/70">
              Four frames from the Drop 01 study. Hard light, hard edges, no
              retouching of the silhouette.
            </p>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-12 gap-x-6 gap-y-10 md:mt-20 md:gap-x-8 md:gap-y-14">
          {looks.map((look, index) => (
            <Reveal
              key={look.id}
              className={placements[index]}
              delay={index * 90}
            >
              <figure className="group">
                <ConceptFigure
                  src={look.image}
                  alt={look.imageAlt}
                  ratio={ratios[index]}
                  sizes="(min-width: 768px) 45vw, 90vw"
                  focus={look.focus}
                  zoom={look.zoom}
                />
                <figcaption className="mt-4 flex items-baseline justify-between gap-4 border-t border-bone/12 pt-3">
                  <span className="label text-acid">{look.id}</span>
                  <span className="text-[0.85rem] text-bone/55">
                    {look.caption}
                  </span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
