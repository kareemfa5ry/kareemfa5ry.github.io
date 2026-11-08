"""Make dummy values that still add up: scale every leaf number by a random factor, recompute every derived one.

Run: python -E -s gen_dummy.py numbers.json relations.json dummy.json [seed]
"""
import json
import random
import sys

from numfmt import fmt, parse

LO, HI = 0.70, 1.30
OPS = {
    "share": lambda a, b: a / b * 100,
    "ratio": lambda a, b: a / b,
    "delta_pct": lambda a, b: (a - b) / b * 100,
}


def load_entries(numbers):
    return {e["id"]: e for ents in numbers.values() for e in ents if e.get("kind", "number") == "number"}


def compute(rel, val):
    xs = [val[c] for c in rel["children"]]
    if rel["op"] in ("sum", "delta"):
        signs = rel.get("signs", [1, -1] if rel["op"] == "delta" else [1] * len(xs))
        return sum(s * x for s, x in zip(signs, xs))
    return OPS[rel["op"]](*xs)


def main(num_path, rel_path, out_path, seed=1):
    rng = random.Random(seed)
    ents = load_entries(json.load(open(num_path, encoding="utf-8")))
    rels = json.load(open(rel_path, encoding="utf-8"))
    hidden = {"hidden:" + k: v for k, v in rels.get("hidden", {}).items()}
    by_parent = {}
    for r in rels["relations"]:
        if r["parent"] in by_parent:
            sys.exit(f"{r['parent']} is defined twice: keep one relation, turn the other into a hidden remainder")
        by_parent[r["parent"]] = r
    val, shown = {}, {}
    for i, e in ents.items():
        if i not in by_parent:
            v = parse(e["text"])[0]
            cap = e.get("max", float("inf"))  # redraw under the cap instead of piling up at it
            val[i] = v if e.get("keep") else v * rng.uniform(LO, min(HI, max(LO, cap / v) if v > 0 else HI))
    for h, base in hidden.items():
        if h not in by_parent:
            val[h] = base * rng.uniform(LO, HI)
    for group in rels.get("descending", []):
        for i, v in zip(group, sorted((val[i] for i in group), reverse=True)):
            val[i] = v
    for i in list(val):
        if i in ents:
            shown[i] = fmt(ents[i]["text"], val[i])
            val[i] = parse(shown[i])[0]  # parents add up the values a reader sees
    todo = dict(by_parent)
    while todo:
        ready = [p for p, r in todo.items() if all(c in val for c in r["children"])]
        if not ready:
            sys.exit(f"cycle or unknown id among: {sorted(todo)}")
        for p in ready:
            val[p] = compute(todo.pop(p), val)
            if p in ents:
                shown[p] = fmt(ents[p]["text"], val[p])
                val[p] = parse(shown[p])[0]
    out = {
        "values": {i: {"new": shown[i]} for i in ents},
        "hidden": {h[7:]: {"value": val[h], "half": 0} for h in hidden},
    }
    json.dump(out, open(out_path, "w", encoding="utf-8"), indent=1, ensure_ascii=False)
    print(f"{len(ents)} numbers, {len(by_parent)} derived, written to {out_path}")


if __name__ == "__main__":
    main(*sys.argv[1:4], *(int(a) for a in sys.argv[4:5]))
