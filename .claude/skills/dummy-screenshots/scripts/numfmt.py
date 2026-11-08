"""Read and write numbers in the exact display format of a screenshot.

Handles $1.2M, 54.31%, 5.9pp, (210,541.28), -0.8, +11,580, $-0.1 and hours as 438:20.
"""
import re
from decimal import ROUND_HALF_UP, Decimal

MULT = {"M": 1e6, "K": 1e3, "B": 1e9}
SUFFIX = re.compile(r"(pp|%|M|K|B)$")


def _parts(text):
    """(negative, body without sign / $ / commas / suffix, suffix)."""
    t = text.replace("$", "").replace(",", "").strip()
    neg = t.startswith("(") or t.startswith("-")
    t = t.strip("()-+")
    m = SUFFIX.search(t)
    suf = m.group(1) if m else ""
    return neg, t[: len(t) - len(suf)], suf


def parse(text):
    """Return (value, half a unit of the last shown digit) for a display string."""
    neg, body, suf = _parts(text)
    sign = -1 if neg else 1
    if ":" in body:  # hours:minutes
        h, m = body.split(":")
        return sign * (int(h) + int(m) / 60), 0.5 / 60
    mult = MULT.get(suf, 1)
    dec = len(body.split(".")[1]) if "." in body else 0
    return sign * float(body) * mult, 0.5 * 10**-dec * mult


def _body(like, value):
    _, body, suf = _parts(like)
    if ":" in body:
        mins = int(Decimal(repr(abs(value) * 60)).quantize(Decimal(1), rounding=ROUND_HALF_UP))
        return f"{mins // 60}:{mins % 60:02d}", mins == 0
    dec = len(body.split(".")[1]) if "." in body else 0
    q = Decimal(repr(abs(value) / MULT.get(suf, 1))).quantize(Decimal(1).scaleb(-dec), rounding=ROUND_HALF_UP)
    return (f"{q:,}" if "," in like else f"{q}") + suf, q == 0


def fmt(like, value):
    """Format value the way the original string `like` is formatted (prefix, suffix, decimals, commas, signs)."""
    body, zero = _body(like, value)
    dollar = "$" if "$" in like else ""
    if value < 0 and not zero:
        if "(" in like:
            return f"({dollar}{body})"
        if like.startswith("$-"):
            return f"$-{body}"
        if "-" in like or not dollar or like.rstrip().endswith(("%", "pp")):
            return f"-{dollar}{body}"
        return f"({dollar}{body})"
    plus = "+" if like.lstrip().startswith("+") else ""
    return f"{plus}{dollar}{body}"
