#!/usr/bin/env python3
"""Generate compact 32-card Mariáš deck from the CC BY 3.0 Commons photograph.

Source: https://commons.wikimedia.org/wiki/File:Doppeldeutsche_Preference.JPG
Author: FUZxxl; license: https://creativecommons.org/licenses/by/3.0/
Download the original photograph, then run:
    python3 scripts/build-prsi-classic-cards.py Doppeldeutsche_Preference.JPG

The source photograph contains 36 double-headed cards in four rows and nine
columns. The last column (six) is excluded from the 32-card Prší deck. Each
photo crop is rescaled for use on small screens; see ../oddechove-hry/assets/
prsi-classic/ATTRIBUTION.md for the credit and transformation details.
"""

from pathlib import Path
import argparse

from PIL import Image, ImageOps


SUITS = ("acorns", "leaves", "hearts", "bells")
RANKS = ("A", "K", "O", "U", "10", "9", "8", "7")
X_BOUNDS = ((439, 819), (834, 1217), (1229, 1610), (1622, 2004),
            (2017, 2396), (2409, 2788), (2799, 3179), (3189, 3571))
Y_BOUNDS = ((38, 636), (653, 1256), (1275, 1876), (1902, 2496))


def build(source: Path, destination: Path):
    with Image.open(source) as original:
        if original.size != (3996, 2526):
            raise ValueError(f"Expected Wikimedia 3996x2526 photo, got {original.size}")
        destination.mkdir(parents=True, exist_ok=True)
        for row, suit in enumerate(SUITS):
            for col, rank in enumerate(RANKS):
                x1, x2 = X_BOUNDS[col]
                y1, y2 = Y_BOUNDS[row]
                # Keep a thin part of the photographed white rounded edge.
                card = original.crop((x1 + 9, y1 + 8, x2 - 9, y2 - 8))
                card = ImageOps.fit(card, (228, 336), method=Image.Resampling.LANCZOS)
                card.save(destination / f"{suit}-{rank}.webp", "WEBP", quality=84, method=6)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("--out", type=Path, default=Path(__file__).resolve().parents[1] /
                        "oddechove-hry/assets/prsi-classic")
    args = parser.parse_args()
    build(args.source, args.out)
