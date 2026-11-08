"""Read and write numbers in the exact display format of a screenshot ($1.2M, 54.31%, (210,541.28), 3,434)."""
from decimal import ROUND_HALF_UP, Decimal

MULT = {"M": 1e6, "K": 1e3, "B": 1e9}


def _body(text):
    t = text.replace("$", "").replace(",", "").strip()
    neg = t.startswith("(") or t.startswith("-")
    return t.strip("()-"), neg


def parse(text):
    """Return (value, half a unit of the last shown digit) for a display string."""
    t, neg = _body(text)
    mult = MULT.get(t[-1:], 1)
    t = t.rstrip("MKB%")
    dec = len(t.split(".")[1]) if "." in t else 0
    return (-1 if neg else 1) * float(t) * mult, 0.5 * 10**-dec * mult


def fmt(like, value):
    """Format value the way the original string `like` is formatted (prefix, suffix, decimals, commas, negatives)."""
    t, _ = _body(like)
    suf = t[-1] if t[-1:] in "MKB%" else ""
    body = t.rstrip("MKB%")
    dec = len(body.split(".")[1]) if "." in body else 0
    q = Decimal(repr(abs(value) / MULT.get(suf, 1))).quantize(Decimal(1).scaleb(-dec), rounding=ROUND_HALF_UP)
    out = ("$" if "$" in like else "") + (f"{q:,}" if "," in like else f"{q}") + suf
    if value < 0 and q != 0:
        out = f"({out})" if "(" in like or "$" in like and suf != "%" else "-" + out
    return out
