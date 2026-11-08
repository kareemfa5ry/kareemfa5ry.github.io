"""Check that every relation holds in dummy.json within display rounding (interval arithmetic).

Run: python -E -s check_dummy.py dummy.json relations.json   (exit 1 on any failure)
"""
import json
import sys
from itertools import product

from numfmt import parse

EPS = 1e-6


def getter(dummy):
    def get(ref):
        if ref.startswith("hidden:"):
            h = dummy["hidden"][ref[7:]]
            return h["value"], h["half"]
        return parse(dummy["values"][ref]["new"])

    return get


def holds(rel, get):
    p, ch = get(rel["parent"]), [get(c) for c in rel["children"]]
    op = rel["op"]
    if op in ("sum", "delta"):
        signs = rel.get("signs", [1, -1] if op == "delta" else [1] * len(ch))
        s = sum(sg * v for sg, (v, _) in zip(signs, ch))
        tol = p[1] + sum(h for _, h in ch) + EPS * max(1.0, abs(s))
        return abs(p[0] - s) <= tol, f"{p[0]:.4f} vs {s:.4f} (tol {tol:.4g})"
    f = {"share": lambda a, b: a / b * 100, "ratio": lambda a, b: a / b, "delta_pct": lambda a, b: (a - b) / b * 100}[op]
    (a, ha), (b, hb) = ch
    vals = [f(x, y) for x, y in product((a - ha, a + ha), (b - hb, b + hb))]
    lo, hi = min(vals), max(vals)
    slack = EPS * max(1.0, abs(hi))
    return p[0] + p[1] >= lo - slack and p[0] - p[1] <= hi + slack, f"{p[0]:.4f} in [{lo:.4f}, {hi:.4f}]"


def main(dummy_path, rel_path):
    dummy = json.load(open(dummy_path, encoding="utf-8"))
    get = getter(dummy)
    rels = json.load(open(rel_path, encoding="utf-8"))["relations"]
    fails = 0
    for name, h in dummy["hidden"].items():
        if h["value"] < 0:
            fails += 1
            print("FAIL hidden", name, "is negative:", h["value"])
    for r in rels:
        ok, why = holds(r, get)
        if not ok:
            fails += 1
            print("FAIL", r.get("name", r["parent"]), why)
    print(f"{len(rels) - fails}/{len(rels)} relations hold")
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main(*sys.argv[1:3])
