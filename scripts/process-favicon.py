"""Remove baked-in checkerboard/gray background and export a true-alpha favicon."""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "public" / "favicon.png"
OUT = ROOT / "public" / "favicon.png"
SIZE = 512


def is_background(r: int, g: int, b: int) -> bool:
    light = (r + g + b) / 3
    sat = max(r, g, b) - min(r, g, b)
    if light >= 235 and sat <= 20:
        return True
    if light >= 200 and sat <= 12:
        return True
    return False


def main() -> None:
    im = Image.open(SRC).convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.uint8)

    alpha = np.full(rgb.shape[:2], 255, dtype=np.uint8)
    for y in range(rgb.shape[0]):
        for x in range(rgb.shape[1]):
            r, g, b = (int(rgb[y, x, 0]), int(rgb[y, x, 1]), int(rgb[y, x, 2]))
            if is_background(r, g, b):
                alpha[y, x] = 0

    arr[:, :, 3] = alpha
    im = Image.fromarray(arr, "RGBA")

    bbox = im.getbbox()
    if not bbox:
        raise SystemExit("No foreground pixels found after background removal")

    im = im.crop(bbox)

    w, h = im.size
    scale = SIZE / max(w, h)
    new_w = max(1, round(w * scale))
    new_h = max(1, round(h * scale))
    im = im.resize((new_w, new_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    offset = ((SIZE - new_w) // 2, (SIZE - new_h) // 2)
    canvas.paste(im, offset, im)
    canvas.save(OUT, format="PNG", optimize=True)
    print(f"Wrote {OUT} ({SIZE}x{SIZE}, RGBA)")


if __name__ == "__main__":
    main()
