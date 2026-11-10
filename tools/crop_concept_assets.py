"""Crop the legacy concept assets so third-party marks fall outside the frame.

Source frames live in `assets/concept-source` (unmodified legacy stock, kept for
provenance). The site ships the cropped, graded-ready versions in
`public/concept`.

Run from the repo root:  python tools/crop_concept_assets.py

After changing the crops, clear the Next.js image optimiser cache — it is
keyed by URL, not by file content, so it keeps serving the previous crop:

    rm -rf .next/cache/images    # macOS / Linux
    Remove-Item -Recurse -Force .next\\cache\\images   # Windows
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "concept-source"
OUT = ROOT / "public" / "concept"

# (source file, output file, (left, top, right, bottom) as fractions)
CROPS = [
    # Campaign frames
    ("campaign.jpg", "look-01.jpg", (0.16, 0.02, 0.98, 0.44)),     # eyewear detail
    ("campaign.jpg", "piece-bomber.jpg", (0.48, 0.33, 1.00, 0.95)), # jacket body, no print
    ("sweatshirt.jpg", "look-02.jpg", (0.12, 0.00, 0.88, 0.38)),   # trouser leg + ledge
    ("denim.jpg", "look-03.jpg", (0.48, 0.45, 1.00, 1.00)),         # black denim only
    ("denim.jpg", "piece-denim.jpg", (0.00, 0.55, 0.32, 1.00)),     # light indigo denim
    ("jacket.jpg", "look-04.jpg", (0.00, 0.52, 0.62, 1.00)),        # leather folds
    ("jacket.jpg", "piece-outerwear.jpg", (0.00, 0.44, 0.36, 0.92)),# leather + zip, label cropped out
    ("runner.jpg", "piece-runner.jpg", (0.00, 0.42, 0.55, 1.00)),   # toe + sole
    ("tee.jpg", "studio.jpg", (0.18, 0.00, 0.82, 0.72)),            # torso crop
    ("look-04.jpg", "hero.jpg", (0.00, 0.00, 1.00, 1.00)),          # full-length silhouette
    ("look-02.jpg", "featured.jpg", (0.04, 0.00, 0.96, 0.92)),     # editorial frame
    ("look-01.jpg", "piece-sleeve.jpg", (0.10, 0.55, 0.90, 1.00)),  # plain body, no chest print
    ("jersey.jpg", "piece-jersey.jpg", (0.05, 0.55, 0.95, 1.00)),   # plain body, no chest badge
]


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for source_name, output_name, box in CROPS:
        source = SRC / source_name
        if not source.exists():
            print(f"skip missing {source_name}")
            continue

        with Image.open(source) as image:
            width, height = image.size
            left, top, right, bottom = box
            region = (
                int(width * left),
                int(height * top),
                int(width * right),
                int(height * bottom),
            )
            cropped = image.crop(region)
            cropped.save(OUT / output_name, "JPEG", quality=82, optimize=True)
            print(f"{source_name} -> {output_name} {cropped.size}")


if __name__ == "__main__":
    build()
