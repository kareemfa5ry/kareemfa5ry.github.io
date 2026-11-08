"""Repaint numbers on the original screenshots, resize bars to match, add the dummy-numbers label.

Run: python -E -s paint.py ORIGINALS_DIR numbers.json dummy.json OUT_DIR [--width 1800] [--label-at NAME=XF,YF ...]
Needs numpy, pillow, opencv-python. Each number is erased (inpaint) and redrawn in the font, size and
position that best matches the old glyphs, in its own colour.
"""
import argparse
import json
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

from numfmt import parse

FD = "C:/Windows/Fonts/"  # Power BI renders in Segoe UI
UPRIGHT = ["segoeui", "segoeuib", "seguisb", "segoeuil", "segoeuisl", "seguibl"]
ITALIC = ["segoeuii", "seguisbi", "segoeuiz", "seguisli", "seguili"]
LABEL = "Dummy numbers \u2014 figures are illustrative, not real data."
_fc = {}


def font(n, s):
    k = (n, round(s * 4))
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FD + n + ".ttf", s)
    return _fc[k]


def hx(h):
    return np.array([int(h[i : i + 2], 16) for i in (1, 3, 5)], float)


def draw_mask(shape, text, name, size, ox, oy):
    im = Image.new("L", (shape[1], shape[0]), 0)
    ImageDraw.Draw(im).text((ox, oy), text, fill=255, font=font(name, size), anchor="ls")
    return np.asarray(im, np.float32) / 255


def inpaint(reg, mask):
    res = cv2.inpaint(cv2.cvtColor(reg.astype(np.uint8), cv2.COLOR_RGB2BGR), mask.astype(np.uint8) * 255, 3,
                      cv2.INPAINT_TELEA)
    return cv2.cvtColor(res, cv2.COLOR_BGR2RGB).astype(float)


def alpha_of(reg, fg, bg):
    """Per-pixel coverage of the text colour fg over bg (0..1); pixels off the fg-bg line count as background."""
    d = fg - bg
    D = np.linalg.norm(d) + 1e-6
    p = reg - bg
    t = (p @ d) / (D * D)
    perp = np.linalg.norm(p - t[..., None] * d, axis=-1)
    a = np.clip(t, 0, 1)
    a[perp > 0.45 * D + 10] = 0
    return a


def ring_bg(img, x0, y0, x1, y1):
    H, W = img.shape[:2]
    a, b, c, d = max(0, x0 - 6), max(0, y0 - 6), min(W, x1 + 6), min(H, y1 + 6)
    m = np.ones((d - b, c - a), bool)
    m[max(0, y0 - 2 - b) : y1 + 2 - b, max(0, x0 - 2 - a) : x1 + 2 - a] = False
    return np.median(img[b:d, a:c][m], 0)


def underline_rows(A, bw):
    cov = (A > 0.5).sum(1)
    return [i for i in range(A.shape[0]) if bw >= 60 and i > A.shape[0] * 0.6 and cov[i] > 0.8 * bw]


def fit(text, A, ul, italic):
    """Font, size and baseline origin whose rendering of `text` best overlaps the coverage map A."""
    keep = np.ones(A.shape[0], bool)
    if ul:
        keep[max(0, min(ul) - 1) : max(ul) + 2] = False
    ink = (A > 0.5) & keep[:, None]
    ys, xs = np.where(ink)
    gx0, gy0, W, H = xs.min(), ys.min(), xs.max() + 1 - xs.min(), ys.max() + 1 - ys.min()
    res = []
    for n in ITALIC if italic else UPRIGHT:
        m = draw_mask((300, int(font(n, 100).getlength(text)) + 200), text, n, 100, 50, 200)
        xx = np.where(m > 0.5)[1]
        s0 = 100 * W / (xx.max() + 1 - xx.min())
        for s in np.arange(max(4, s0 - 1.5), s0 + 1.51, 0.25):
            m = draw_mask((int(s * 3) + 20, int(font(n, s).getlength(text)) + 80), text, n, s, 30, s * 1.6)
            yy, xx = np.where(m > 0.5)
            if len(xx):
                iw, ih = xx.max() + 1 - xx.min(), yy.max() + 1 - yy.min()
                e = abs(iw - W) / W + (0 if ul else abs(ih - H) / max(H, 1))
                res.append((e, n, s, 30 - xx.min(), s * 1.6 - yy.min()))
    best, seen = None, set()
    for e, n, s, dx, dy in sorted(res, key=lambda r: r[0]):
        if n in seen:
            continue
        seen.add(n)
        for ddx in (-1, -0.5, 0, 0.5, 1):
            for ddy in (-1, -0.5, 0, 0.5, 1):
                ox, oy = gx0 + dx + ddx, gy0 + dy + ddy
                m = draw_mask(A.shape, text, n, s, ox, oy)
                err = np.abs(m[keep] - A[keep]).sum() / (A[keep].sum() + 1)
                if best is None or err < best[4]:
                    best = (n, s, ox, oy, err)
    return best


def split_arrow(A, x1_rel):
    """Cut a trailing icon (trend arrow) off the coverage map so it can move with the text."""
    idx = np.where((A > 0.5).sum(0) > 0)[0]
    groups = np.split(idx, np.where(np.diff(idx) > 8)[0] + 1) if len(idx) else []
    if len(groups) < 2 or len(groups[-1]) >= 48 or groups[-1].min() <= x1_rel - 40:
        return None
    a0, a1 = groups[-1].min() - 2, groups[-1].max() + 3
    arrow = np.zeros_like(A)
    arrow[:, a0:a1] = A[:, a0:a1]
    A[:, a0:a1] = 0
    return arrow


def paint_number(img, e, new, log):
    x0, y0, x1, y1 = e["bbox"]
    H, W = img.shape[:2]
    arrow_on = e.get("arrow", False)
    rx0, ry0 = max(0, x0 - 10), max(0, y0 - 10)
    rx1, ry1 = min(W, x1 + 10 + (70 if arrow_on else 0)), min(H, y1 + 10)
    reg = img[ry0:ry1, rx0:rx1].astype(float)
    fg = hx(e["fg"])
    bg = hx(e["bg"]) if e.get("bg", "nonflat") != "nonflat" else ring_bg(img, x0, y0, x1, y1).astype(float)
    A = alpha_of(reg, fg, bg)
    lim = np.zeros(A.shape, bool)
    lim[max(0, y0 - ry0 - 3) : y1 - ry0 + 3, max(0, x0 - rx0 - 6) : x1 - rx0 + 3] = True
    arrow = split_arrow(A, x1 - rx0) if arrow_on else None
    A[~lim] = 0
    ul = [r + (y0 - ry0) for r in underline_rows(A[y0 - ry0 : y1 - ry0], x1 - x0)]
    name, size, ox, oy, err = fit(e["text"], A, ul, e.get("italic", False))
    f = font(name, size)
    advo, advn = f.getlength(e["text"]), f.getlength(new)
    nox = {"left": ox, "right": ox + advo - advn}.get(e.get("align", "left"), ox + (advo - advn) / 2)
    mask = cv2.dilate((A > 0.04).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    mask &= lim
    m = draw_mask(A.shape, new, name, size, nox, oy)
    if arrow is not None:
        mask |= cv2.dilate((arrow > 0.08).astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
        m = np.maximum(m, np.roll(arrow, int(round((nox + advn) - (ox + advo))), axis=1))
    out = inpaint(reg, mask)
    out = out * (1 - m[..., None]) + fg * m[..., None]
    if ul:  # redraw the underline at the new text width
        r0, r1 = min(ul), max(ul)
        cols = np.where((A[r0 : r1 + 1] > 0.5).any(0))[0]
        lp, rp = cols.min() - ox, (ox + advo) - (cols.max() + 1)
        nx0, nx1 = int(round(nox + lp)), int(round(nox + advn - rp))
        for r in range(r0 - 2, r1 + 3):
            a = float(np.median(A[r, cols.min() + 3 : cols.max() - 2])) if 0 <= r < A.shape[0] else 0
            if a > 0.15:
                out[r, nx0:nx1] = out[r, nx0:nx1] * (1 - min(1, a)) + fg * min(1, a)
    img[ry0:ry1, rx0:rx1] = np.clip(out + 0.5, 0, 255).astype(np.uint8)
    log.append(f"{e['id']} {e['text']} -> {new} {name} {size:.1f} err={err:.2f}")


def stretch_bar(img, b, ratio, log):
    """Lengthen or shorten a horizontal bar (bbox includes its outline) by repeating or cutting its middle."""
    x0, y0, x1, y1 = b["bbox"]
    d = int(round((x1 - x0) * (ratio - 1)))
    if d == 0:
        return
    ya, yb = y0 - 1, y1 + 1
    blk = img[ya:yb, x0 : x1 + 1].copy()
    isc = cv2.dilate((np.linalg.norm(blk.astype(float) - hx(b["fill"]), axis=2) < 90).astype(np.uint8),
                     np.ones((3, 3), np.uint8)) > 0
    w, mid = x1 + 1 - x0, (x1 + 1 - x0) // 2
    cols = (np.concatenate([np.arange(mid), np.full(d, mid), np.arange(mid, w)]) if d > 0
            else np.concatenate([np.arange(mid), np.arange(mid - d, w)]))
    ex0, ex1 = x0 + mid, max(x1, x1 + d) + 3
    em = np.zeros((yb - ya, ex1 - ex0), bool)
    em[:, : x1 + 1 - ex0] = isc[:, mid:]
    img[ya:yb, ex0:ex1] = inpaint(img[ya:yb, ex0:ex1], em).astype(np.uint8)
    sub = img[ya:yb, x0 : x0 + len(cols)]
    sub[isc[:, cols]] = blk[:, cols][isc[:, cols]]
    log.append(f"bar {b['id']} {x1} -> {x1 + d}")


def erase(img, box):
    """Inpaint whatever stands out from the surrounding background inside box (stray specks after painting)."""
    x0, y0, x1, y1 = box
    reg = img[y0:y1, x0:x1].astype(float)
    m = np.abs(reg - ring_bg(img, x0, y0, x1, y1)).sum(-1) > 40
    img[y0:y1, x0:x1] = inpaint(reg, cv2.dilate(m.astype(np.uint8), np.ones((3, 3), np.uint8))).astype(np.uint8)


def label(img, at):
    """Quote-style label: dark rounded box, gold bar on the left, italic Segoe UI. at = (x, y) as fractions."""
    H, W = img.shape[:2]
    f = font("segoeuii", int(W * 0.0115))
    size = f.size
    pad, bar, ch = int(size * 0.7), int(size * 0.25), int(size * 1.9)
    cw = int(f.getlength(LABEL)) + 2 * pad + bar
    x, y = int(W * at[0]), int(H * at[1]) - ch if at[1] is not None else H - ch - int(H * 0.02)
    base = Image.fromarray(img).convert("RGBA")
    ov = Image.new("RGBA", base.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    d.rounded_rectangle((x, y, x + cw, y + ch), radius=int(ch * 0.2), fill=(18, 22, 28, 215))
    d.rectangle((x, y, x + bar, y + ch), fill=(225, 194, 51, 255))
    d.text((x + bar + pad, y + ch // 2), LABEL, font=f, fill=(240, 240, 240, 255), anchor="lm")
    return np.asarray(Image.alpha_composite(base, ov).convert("RGB")).copy()


def run(name, src, ents, values, out, width, at):
    img = np.asarray(Image.open(src).convert("RGB")).copy()
    log = []
    nums = {e["id"]: e for e in ents if e.get("kind", "number") == "number"}
    for b in (e for e in ents if e.get("kind") == "bar"):
        old, new = parse(nums[b["value_of"]]["text"])[0], parse(values[b["value_of"]]["new"])[0]
        stretch_bar(img, b, new / old if old else 1, log)
    for e in nums.values():
        new = values.get(e["id"], {}).get("new", e["text"])
        if not e.get("keep") and new != e["text"]:
            paint_number(img, e, new, log)
    for e in (e for e in ents if e.get("kind") == "erase"):
        erase(img, e["bbox"])
    img = label(img, at)
    fin = Image.fromarray(img)
    if width and fin.width > width:
        fin = fin.resize((width, round(fin.height * width / fin.width)), Image.LANCZOS)
    fin.save(os.path.join(out, name), optimize=True)
    open(os.path.join(out, name + ".log.txt"), "w", encoding="utf-8").write("\n".join(log))
    print(name, len(log), "changes")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("originals")
    ap.add_argument("numbers")
    ap.add_argument("dummy")
    ap.add_argument("out")
    ap.add_argument("--width", type=int, default=1800)
    ap.add_argument("--label-at", action="append", default=[], help="NAME=XF,YF fractions of width and height")
    a = ap.parse_args()
    nums = json.load(open(a.numbers, encoding="utf-8"))
    values = json.load(open(a.dummy, encoding="utf-8"))["values"]
    spots = {k: tuple(float(v) for v in xy.split(",")) for k, xy in (s.split("=") for s in a.label_at)}
    os.makedirs(a.out, exist_ok=True)
    for name, ents in nums.items():
        run(name, os.path.join(a.originals, name), ents, values, a.out, a.width, spots.get(name, (0.015, None)))


if __name__ == "__main__":
    main()
