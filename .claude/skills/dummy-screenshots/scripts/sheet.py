"""Before / after crop sheet per screenshot, one row per changed number, for reviewing the paint by eye.

Run: python -E -s sheet.py ORIGINALS_DIR FINAL_DIR numbers.json dummy.json SHEET_DIR
"""
import json
import os
import sys

from PIL import Image, ImageDraw


def crops(orig, fin, box, pad=12):
    sc = fin.width / orig.width
    x0, y0, x1, y1 = box
    a = orig.crop((x0 - pad, y0 - pad, x1 + pad + 60, y1 + pad))
    b = fin.crop(tuple(int(v * sc) for v in (x0 - pad, y0 - pad, x1 + pad + 60, y1 + pad))).resize(a.size)
    return a, b


def main(orig_dir, fin_dir, num_path, dummy_path, out_dir):
    nums = json.load(open(num_path, encoding="utf-8"))
    vals = json.load(open(dummy_path, encoding="utf-8"))["values"] if dummy_path != "-" else {}
    os.makedirs(out_dir, exist_ok=True)
    for name, ents in nums.items():
        orig = Image.open(os.path.join(orig_dir, name)).convert("RGB")
        fin = Image.open(os.path.join(fin_dir, name)).convert("RGB")
        new = {e["id"]: e.get("new") or vals.get(e["id"], {}).get("new", e["text"]) for e in ents if "text" in e}
        rows = [(e, *crops(orig, fin, e["bbox"])) for e in ents if "text" in e and new[e["id"]] != e["text"]]
        if not rows:
            continue
        w = max(a.width for _, a, _ in rows) * 2 + 30
        sheet = Image.new("RGB", (w, sum(a.height + 30 for _, a, _ in rows)), "white")
        d, y = ImageDraw.Draw(sheet), 0
        for e, a, b in rows:
            d.text((6, y + 4), f"{e['id']}: {e['text']} -> {new[e['id']]}", fill=(200, 0, 0))
            sheet.paste(a, (6, y + 22))
            sheet.paste(b, (a.width + 20, y + 22))
            y += a.height + 30
        sheet.save(os.path.join(out_dir, "sheet-" + name))
        print(name, len(rows), "rows")


if __name__ == "__main__":
    main(*sys.argv[1:6])
