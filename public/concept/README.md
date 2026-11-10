# Concept frames served by the site

Every file here is **placeholder art**, not Echo & Air brand photography.
Each frame renders a visible "Concept" tag and the footer carries a disclosure.

Regenerate these crops from `assets/concept-source/` with:

```bash
python tools/crop_concept_assets.py
```

| File                   | Source frame                    | Crop                        |
| ---------------------- | ------------------------------- | --------------------------- |
| `hero.jpg`             | `look-04.jpg` (full length)     | full frame                  |
| `featured.jpg`         | `look-02.jpg` (editorial)       | 4–96% wide, top 92%         |
| `studio.jpg`           | `tee.jpg`                       | torso crop                  |
| `look-01.jpg`          | `campaign.jpg`                  | eyewear detail              |
| `look-02.jpg`          | `sweatshirt.jpg`                | trouser leg + ledge         |
| `look-03.jpg`          | `denim.jpg`                     | dark denim only             |
| `look-04.jpg`          | `jacket.jpg`                    | leather folds               |
| `piece-sleeve.jpg`     | `look-01.jpg`                   | full frame                  |
| `piece-outerwear.jpg`  | `jacket.jpg`                    | full frame                  |
| `piece-bomber.jpg`     | `campaign.jpg`                  | full frame                  |
| `piece-runner.jpg`     | `runner.jpg`                    | toe + sole                  |
| `piece-denim.jpg`      | `denim.jpg`                     | full frame                  |
| `piece-jersey.jpg`     | `jersey.jpg`                    | full frame                  |

Replace with real campaign photography in a later phase and remove the
monochrome + acid duotone grade in `components/ui/ConceptFigure.tsx`.
