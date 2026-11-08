"""Tighten each rough number box in numbers.json to its ink and fill in fg / bg colours (in place).

Run: python -E -s measure.py ORIGINALS_DIR numbers.json
Only touches entries without "fg". bg becomes "nonflat" when the background is a photo or gradient.
"""
import json
import os
import sys

import numpy as np
from PIL import Image


def hexc(c):
    return "#%02x%02x%02x" % tuple(int(v) for v in c)


def tighten(a, box, pad=3):
    H, W = a.shape[:2]
    x0, y0, x1, y1 = box
    x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(W, x1 + pad), min(H, y1 + pad)
    c = a[y0:y1, x0:x1]
    bg = np.median(np.concatenate([c[0], c[-1], c[:, 0], c[:, -1]]), 0)
    ys, xs = np.nonzero(np.abs(c - bg).sum(-1) > 150)
    if len(xs) < 5:
        return [x0, y0, x1, y1]
    return [int(x0 + xs.min()), int(y0 + ys.min()), int(x0 + xs.max() + 1), int(y0 + ys.max() + 1)]


def colours(a, box, p=3):
    H, W = a.shape[:2]
    x0, y0, x1, y1 = box
    big = a[max(0, y0 - p) : min(H, y1 + p), max(0, x0 - p) : min(W, x1 + p)]
    ring = np.concatenate([big[:p].reshape(-1, 3), big[-p:].reshape(-1, 3),
                           big[:, :p].reshape(-1, 3), big[:, -p:].reshape(-1, 3)])
    bg = np.median(ring, 0)
    c = a[y0:y1, x0:x1].reshape(-1, 3)
    d = np.abs(c - bg).sum(-1)
    fg = np.median(c[np.argsort(d)[-max(5, int(d.size * 0.06)) :]], 0)
    return hexc(fg), "nonflat" if ring.std(0).mean() > 14 else hexc(bg)


def main(orig_dir, num_path):
    nums = json.load(open(num_path, encoding="utf-8"))
    for name, ents in nums.items():
        a = np.asarray(Image.open(os.path.join(orig_dir, name)).convert("RGB")).astype(int)
        for e in ents:
            if e.get("kind", "number") in ("number", "label") and "fg" not in e:
                e["bbox"] = tighten(a, e["bbox"])
                e["fg"], e["bg"] = colours(a, e["bbox"])
    json.dump(nums, open(num_path, "w", encoding="utf-8"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main(*sys.argv[1:3])
