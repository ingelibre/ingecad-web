#!/usr/bin/env python3
# SPDX-License-Identifier: GPL-3.0-or-later
# Copyright (C) 2026 Marco Sumari Tellez and IngeCAD contributors.
"""Regenerate the site's icon artwork from the product's SVG.

    python3 tools/gen-images.py [--product ../]

The single source of truth is ``resources/ingecad.svg`` in the product repo, so
whenever the app icon changes this brings the site along:

  * images/logo.png            256  — header and footer mark
  * images/logo-512.png        512  — PWA-sized, also the JSON-LD image
  * images/favicon-16.png       16
  * images/favicon-32.png       32
  * images/apple-touch-icon.png 180
  * images/og-banner.jpg  1200x630 — the icon area only, see below

The OG banner is NOT rebuilt from scratch. Its typography was composed by hand
and the exact font metrics are not worth re-deriving; instead this repaints its
two derived areas — the icon and the screenshot panel — by filling each with the
banner's own background gradient (a plain vertical ramp, sampled from the two
corners) and pasting the new artwork back at the same place and size. One JPEG
generation, and the type stays byte for byte the design that was approved.

The screenshot panel's geometry was recovered by correlating the old banner
against the old hero image, since the original composition script was not kept:
best fit at width 640 with the source's top 112 rows cropped, pasted at
(600, 138) and bleeding off the right edge. Keep those numbers together.

Needs Inkscape and Pillow.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parents[1]
IMAGES = HERE / "images"

# size → output name
LOGOS = {
    256: "logo.png",
    512: "logo-512.png",
    16: "favicon-16.png",
    32: "favicon-32.png",
    180: "apple-touch-icon.png",
}

# Where the icon sits on the 1200x630 banner. Measured from the approved file:
# the rounded tile occupies x 76..171, y 98..189, and the tile is 112 of the
# SVG's 128 units, hence a 106 px render offset by 8/128 of it.
BANNER = "og-banner.jpg"
ICON_PX = 106
ICON_AT = (69, 91)
# generous enough to also erase the tile's soft shadow
ICON_BOX = (64, 86, 180, 198)

# The screenshot panel, derived from the hero image (see the module docstring).
HERO = "screenshots/principal.jpeg"
SHOT_W = 640            # width the hero is scaled to
SHOT_CROP_TOP = 112     # source rows dropped off the top, before scaling
SHOT_AT = (600, 138)
SHOT_BOX = (592, 130, 1200, 500)


def render(svg: Path, size: int, out: Path) -> None:
    subprocess.run(["inkscape", "-w", str(size), "-h", str(size), str(svg),
                    "-o", str(out)], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def repaint_banner(svg: Path) -> None:
    """Swap the icon and the screenshot on the OG banner, keeping the type."""
    path = IMAGES / BANNER
    banner = Image.open(path).convert("RGB")
    _, h = banner.size

    # The background is a vertical ramp; both top corners agree, so sampling
    # one column of each edge is enough to rebuild it exactly.
    top = banner.getpixel((2, 2))
    bottom = banner.getpixel((2, h - 3))

    def erase(box: tuple[int, int, int, int]) -> None:
        x0, y0, x1, y1 = box
        patch = Image.new("RGB", (x1 - x0, y1 - y0))
        px = patch.load()
        for y in range(y0, y1):
            t = y / (h - 1)
            colour = tuple(round(a + (b - a) * t) for a, b in zip(top, bottom))
            for x in range(x1 - x0):
                px[x, y - y0] = colour
        banner.paste(patch, (x0, y0))

    erase(ICON_BOX)
    icon_png = IMAGES / ".icon-tmp.png"
    render(svg, ICON_PX, icon_png)
    icon = Image.open(icon_png).convert("RGBA")
    banner.paste(icon, ICON_AT, icon)
    icon_png.unlink()

    erase(SHOT_BOX)
    hero = Image.open(IMAGES / HERO).convert("RGB")
    hero = hero.crop((0, SHOT_CROP_TOP, hero.width, hero.height))
    hero = hero.resize((SHOT_W, round(hero.height * SHOT_W / hero.width)),
                       Image.LANCZOS)
    banner.paste(hero, SHOT_AT)

    banner.save(path, "JPEG", quality=92, optimize=True, progressive=True)
    print(f"  images/{BANNER}  (icon + screenshot repainted)")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--product", default=str(HERE.parent),
                    help="path to the ingecad product repo (default: ..)")
    args = ap.parse_args()

    if not shutil.which("inkscape"):
        print("!! inkscape is not on PATH", file=sys.stderr)
        return 1
    svg = Path(args.product).expanduser().resolve() / "resources" / "ingecad.svg"
    if not svg.is_file():
        print(f"!! missing {svg}", file=sys.stderr)
        return 1

    for size, name in LOGOS.items():
        render(svg, size, IMAGES / name)
        print(f"  images/{name}  ({size}px)")
    repaint_banner(svg)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
