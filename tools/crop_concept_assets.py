"""Crop the legacy concept assets so third-party marks fall outside the frame.

Source frames live in `assets/concept-source` (unmodified legacy stock, kept for
provenance). The site ships the cropped, graded-ready versions in
`public/concept`.

Run from the repo root:  python tools/crop_concept_assets.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets" / "concept-source"
OUT = ROOT / "public" / "concept"

# source file -> (output file, (left, top, right, bottom) as fractions)
CROPS = {
    "campaign.jpg": ("look-01.jpg", (0.16, 0.02, 0.98, 0.44)),      # face / eyewear detail
    "sweatshirt.jpg": ("look-02.jpg", (0.12, 0.00, 0.88, 0.38)),   # trouser leg + ledge
    "denim.jpg": ("look-03.jpg", (0.52, 0.50, 1.00, 1.00)),         # dark denim only
    "jacket.jpg": ("look-04.jpg", (0.00, 0.52, 0.62, 1.00)),        # leather folds
    "runner.jpg": ("piece-runner.jpg", (0.00, 0.48, 0.44, 1.00)),   # toe + sole
    "tee.jpg": ("studio.jpg", (0.18, 0.00, 0.82, 0.72)),            # torso crop
    "look-04.jpg": ("hero.jpg", (0.00, 0.00, 1.00, 1.00)),          # full-length silhouette
    "look-02.jpg": ("featured.jpg", (0.04, 0.00, 0.96, 0.92)),     # editorial frame
    "look-01.jpg": ("piece-sleeve.jpg", (0.00, 0.00, 1.00, 1.00)), # hanger frame
    "jersey.jpg": ("piece-jersey.jpg", (0.00, 0.00, 1.00, 1.00)),  # flat lay
    # Full frames reused for the small list thumbnails.
    "jacket.jpg#piece-outerwear.jpg": ("piece-outerwear.jpg", (0.00, 0.00, 1.00, 1.00)),
    "campaign.jpg#piece-bomber.jpg": ("piece-bomber.jpg", (0.00, 0.00, 1.00, 1.00)),
    "denim.jpg#piece-denim.jpg": ("piece-denim.jpg", (0.00, 0.00, 1.00, 1.00)),
}


def build() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for key, (output_name, box) in CROPS.items():
        source_name = key.split("#")[0]
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
