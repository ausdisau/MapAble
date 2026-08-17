#!/usr/bin/env python3
"""Remove solid black backgrounds from MapAble logo PNGs.

For public/brand/mapable-logo.png use corner flood-fill (preserves wordmark + tagline).
rembg subject isolation crops the vertical lockup to the icon only — do not use on
mapable-logo.png unless only the pin/mark is desired.
"""

from __future__ import annotations

import sys
from io import BytesIO
from pathlib import Path

from PIL import Image
import numpy as np

try:
    from rembg import remove
except ImportError as exc:
    raise SystemExit("Install rembg: pip install 'rembg[cpu]'") from exc

DEFAULT = Path(__file__).resolve().parents[1] / "public/brand/accessible-australia-logo.png"


def clean_fringe(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"), dtype=np.int32)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    brightness = (r + g + b) / 3.0
    sat = np.maximum(np.maximum(r, g), b) - np.minimum(np.minimum(r, g), b)
    fringe = (a > 0) & (
        ((sat < 20) & (brightness > 170))
        | ((r > 200) & (g > 200) & (b > 200) & (sat < 35))
        | (a < 40)
    )
    smoke = (a > 0) & (a < 180) & (sat < 40) & (brightness > 120) & (brightness < 235)
    arr[:, :, 3] = np.where(fringe | smoke, 0, a)
    solid = (a > 200) & (sat > 15)
    arr[:, :, 3] = np.where(solid, 255, arr[:, :, 3])
    out = Image.fromarray(arr.astype(np.uint8))
    alpha = np.array(out)[:, :, 3]
    ys, xs = np.where(alpha > 20)
    if len(xs) == 0:
        return out
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    pad = 4
    return out.crop(
        (
            max(0, x0 - pad),
            max(0, y0 - pad),
            min(out.width, x1 + pad + 1),
            min(out.height, y1 + pad + 1),
        )
    )


def main() -> None:
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT
    raw = target.read_bytes()
    cutout = Image.open(BytesIO(remove(raw))).convert("RGBA")
    clean_fringe(cutout).save(target)
    print(f"Wrote transparent logo: {target}")


if __name__ == "__main__":
    main()
