# Concept frames served by the site

Every file here is **placeholder art**, not Echo & Air brand photography.
Each frame renders a visible "Concept" tag and the footer carries a disclosure.

Regenerate these crops from `assets/concept-source/` with:

```bash
python tools/crop_concept_assets.py
```

Then clear the Next.js image optimiser cache before rebuilding — it is keyed by
URL rather than file content, so it otherwise keeps serving the previous crop:

```bash
rm -rf .next/cache/images    # macOS / Linux
Remove-Item -Recurse -Force .next\cache\images   # Windows
```

| File                   | Source frame                    | Crop                             |
| ---------------------- | ------------------------------- | -------------------------------- |
| `hero.jpg`             | `look-04.jpg` (full length)     | full frame                       |
| `featured.jpg`         | `look-02.jpg` (editorial)       | 4–96% wide, top 92%              |
| `studio.jpg`           | `tee.jpg`                       | torso crop                       |
| `look-01.jpg`          | `campaign.jpg`                  | eyewear detail                   |
| `piece-bomber.jpg`     | `campaign.jpg`                  | jacket body, chest print cropped |
| `look-02.jpg`          | `sweatshirt.jpg`                | trouser leg + ledge              |
| `look-03.jpg`          | `denim.jpg`                     | black denim, no patches          |
| `piece-denim.jpg`      | `denim.jpg`                     | light indigo denim               |
| `look-04.jpg`          | `jacket.jpg`                    | leather folds                    |
| `piece-outerwear.jpg`  | `jacket.jpg`                    | leather + zip, label cropped out |
| `piece-runner.jpg`     | `runner.jpg`                    | toe + sole, logo cropped out     |
| `piece-sleeve.jpg`     | `look-01.jpg`                   | plain body, chest print cropped  |
| `piece-jersey.jpg`     | `jersey.jpg`                    | plain body, chest badge cropped  |

The crops deliberately exclude the third-party marks that appear in the raw
legacy stock (retailer labels, competitor logos and chest prints).

Replace with real campaign photography in a later phase and remove the
monochrome + acid duotone grade in `components/ui/ConceptFigure.tsx`.
