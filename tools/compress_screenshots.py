"""Compress the review screenshots so they stay small enough to commit.

Playwright writes full-resolution JPEGs; this scales the full-page captures
down and re-encodes them at a lower quality.

Run from the repo root:  python tools/compress_screenshots.py
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SHOTS = ROOT / "docs" / "screenshots"

MAX_WIDTH = {
    "home-desktop-1440.jpg": 1080,
    "home-tablet-768.jpg": 720,
    "home-mobile-375.jpg": 375,
}
QUALITY = 72


def main() -> None:
    for name, width in MAX_WIDTH.items():
        path = SHOTS / name
        if not path.exists():
            print(f"skip missing {name}")
            continue

        with Image.open(path) as image:
            image = image.convert("RGB")
            if image.width > width:
                height = round(image.height * width / image.width)
                image = image.resize((width, height), Image.LANCZOS)
            image.save(
                path, "JPEG", quality=QUALITY, optimize=True, progressive=True
            )
            print(f"{name} -> {image.size} {path.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
