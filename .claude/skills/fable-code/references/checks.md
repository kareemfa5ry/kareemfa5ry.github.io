# Checks: copy-paste commands

Run from the repo root, in **bash** (`bash` first if your shell is zsh: zsh does not split `$VAR` into words).
Host python 3.9, stdlib only. Numbers match the "before committing" table in SKILL.md. Every check judges
what YOU added; hits that were already on the base are reported as "pre-existing", not fixed.

## 0. Setup (once per session)

```bash
CHK="${TMPDIR:-/tmp}/fable-code"; mkdir -p "$CHK"
BASE=HEAD                                   # uncommitted work; for a branch: BASE=$(git merge-base HEAD origin/develop)
git add -N path/to/each/new_file.py         # intent-to-add: new files appear in every `git diff` below
rf() { ruff "$@"; }                         # no ruff on PATH? rf() { uvx "ruff@$(grep -ho 'ruff==[0-9.]*' requirements*.txt | head -1 | cut -d= -f3)" "$@"; }
```

## 1. Changed files

```bash
CHANGED=$(git diff --name-only --diff-filter=d "$BASE"); PY=$(echo "$CHANGED" | grep '\.py$'); echo "$CHANGED"
```

## 2. Sizes, before -> after (FAIL = over 400 and grew)

```bash
for f in $PY; do b=$(git show "$BASE:$f" 2>/dev/null | wc -l); a=$(wc -l < "$f"); echo "$b -> $a $f"; done \
  | awk '{ if ($3 > 400 && $3 > $1) $0 = $0 "   FAIL: over 400 and grew"; print }'
```

## 3. Loose modules per folder, before -> after (FAIL = over 8 and grew)

Before adding a file, run it on the target folder alone: `echo src/x/y | python3 "$CHK/loose_count.py" "$BASE"`.

```bash
cat > "$CHK/loose_count.py" <<'PYEOF'
"""loose_count.py BASE < folders : loose modules per folder, BASE -> now. Loose = a .py directly in the folder,
except __init__.py, __main__.py, conftest.py (tests count). Exit 1 when a folder ends over 8 and grew."""
import subprocess, sys
from pathlib import Path
SKIP, CAP, bad = ("__init__.py", "__main__.py", "conftest.py"), 8, 0
def loose(names): return sum(1 for n in names if n.endswith(".py") and n not in SKIP)
for d in sorted(set(sys.stdin.read().split())):
    old = subprocess.run(["git", "ls-tree", "--name-only", sys.argv[1], d + "/"], capture_output=True, text=True).stdout
    before = loose(Path(x).name for x in old.split())
    now = loose(f.name for f in Path(d).iterdir() if f.is_file()) if Path(d).is_dir() else 0
    verdict = "FAIL: over %d and grew, use a subpackage" % CAP if now > CAP and now > before else "full: add nothing" if now >= CAP else ""
    bad += verdict.startswith("FAIL")
    print("%3d -> %3d  %s  %s" % (before, now, d, verdict))
sys.exit(1 if bad else 0)
PYEOF
echo "$PY" | xargs -n1 dirname | python3 "$CHK/loose_count.py" "$BASE"
```

## 4. Lint

```bash
rf check $PY                                  # the repo's ruff.toml / pyproject is picked up by itself
make lint-strict 2>/dev/null | tail -3        # only if the Makefile has it: must say "none new or worse"
```

No scripts-tests image? Run the ratchet in the tests image: `docker compose -p <you> --profile test run --rm -T
-v "$PWD/scripts:/app/scripts:ro" tests python scripts/endpoint_capture/code_gates/lint_ratchet.py` (must print
'none new or worse'). 'Not run' is a FAIL in the handoff, never a pass.

No `lint-strict` in the repo? Diff the complexity limits yourself (C901 10, PLR0911 returns 6, PLR0912
branches 12, PLR0913 args 5, PLR0915 statements 50). Prints only hits that are new or worse than on BASE:

```bash
SEL=C901,PLR0911,PLR0912,PLR0913,PLR0915
hits() { grep -E '^[^ ]+:[0-9]+:' | sed -E 's/:[0-9]+:[0-9]+:/:/' | sort; }
for f in $PY; do
  git show "$BASE:$f" 2>/dev/null | rf check --no-cache --select $SEL --output-format concise --stdin-filename "$f" - 2>/dev/null | hits > "$CHK/b"
  rf check --no-cache --select $SEL --output-format concise "$f" 2>/dev/null | hits > "$CHK/a"
  comm -13 "$CHK/b" "$CHK/a"
done
```

Fix a hit by extracting a function or grouping arguments in a small frozen dataclass. Never `noqa`.

## 5. Fresh-process import of every changed module

`ROOT_PKG` is the top package (`src` in retail-edge-backend; `backend` modules are imported from inside
`backend/` in corp: run from there with paths relative to it). Use the repo's interpreter: its `.venv`,
or the test image when the host lacks the drivers.

```bash
cat > "$CHK/import_each.py" <<'PYEOF'
import subprocess, sys
bad = 0
for m in sys.argv[1:]:
    got = subprocess.run([sys.executable, "-c", "import " + m], capture_output=True, text=True)
    if got.returncode:
        bad += 1
        print("FAIL import %s: %s" % (m, (got.stderr.strip().splitlines() or ["exit %d" % got.returncode])[-1]))
print("imported alone: %d ok, %d failed" % (len(sys.argv) - 1 - bad, bad)); sys.exit(1 if bad else 0)
PYEOF
ROOT_PKG=src
MODS=$(echo "$PY" | grep "^$ROOT_PKG/" | grep -v '/docs/' | sed -E 's#/__init__\.py$##; s#\.py$##; s#/#.#g')
.venv/bin/python "$CHK/import_each.py" $MODS
# in Docker (one container), then clean up the way the repo says (retail-edge-backend: --profile test down --rmi local):
# docker compose -p fc$$ run --rm -v "$CHK:/chk:ro" tests python /chk/import_each.py $MODS
# docker compose -p fc$$ --profile test down --rmi local; docker images | grep fc$$   # must print nothing
```

Pytest collection is not check #5: run `import_each.py` (and host `python3` for modules scripts read). After
`down --rmi local`, `docker images | grep <you>` must be empty; remove a leftover by its exact name
(`docker rmi <you>-tests:latest`).

`partially initialized module` in the error = an import cycle. Fix: move the shared code down a layer.
`ModuleNotFoundError` for a third-party package (pydantic, sqlalchemy) or a `TypeError` on `X | Y` means the
interpreter is wrong, not the code: rerun with the repo's venv or test image. Only that run counts.

## 6. Import cycles through the changed modules (static, host python)

```bash
cat > "$CHK/cycle_check.py" <<'PYEOF'
"""cycle_check.py IMPORT_ROOT FILE.py... : print import cycles that run through FILE(s); exit 1 if any.
IMPORT_ROOT = the folder on sys.path. Import-time imports only (def bodies and `if TYPE_CHECKING:` skipped)."""
import ast, sys
from pathlib import Path
root = Path(sys.argv[1]).resolve()
def name(p):
    parts = list(p.resolve().relative_to(root).with_suffix("").parts)
    return ".".join(parts[:-1] if parts[-1] == "__init__" else parts)
def runs_at_import(body):
    for n in body:
        if isinstance(n, (ast.Import, ast.ImportFrom)): yield n
        elif isinstance(n, ast.If) and "TYPE_CHECKING" in ast.dump(n.test): yield from runs_at_import(n.orelse)
        elif not isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)):
            for f in ("body", "orelse", "finalbody", "handlers"): yield from runs_at_import(getattr(n, f, []))
def edges(p):
    pkg = name(p).split(".")[:None if p.name == "__init__.py" else -1]
    try: tree = ast.parse(p.read_text(encoding="utf-8"))
    except (SyntaxError, UnicodeDecodeError) as e: print("NOT PARSED (use the repo's python):", p, e.__class__.__name__); return set()
    out = set()
    for n in runs_at_import(tree.body):
        if isinstance(n, ast.Import): out |= {a.name for a in n.names}; continue
        base = ".".join((pkg[:len(pkg) - n.level + 1] if n.level else []) + [n.module or ""]).strip(".")
        out |= {base + "." + a.name if base + "." + a.name in mods else base for a in n.names}
    return out & mods.keys()
mods = {name(p): p for p in root.rglob("*.py") if not any(x.startswith(".") or x in ("venv", "node_modules") for x in p.relative_to(root).parts)}
graph = {m: edges(p) for m, p in mods.items()}
bad = 0
for start in sorted({name(Path(f)) for f in sys.argv[2:]}):
    todo, seen = [[start]], {start}
    while todo:
        path = todo.pop()
        if start in graph.get(path[-1], set()): print("CYCLE:", " -> ".join(path + [start])); bad += 1; break
        for nxt in sorted(graph.get(path[-1], set()) - seen): seen.add(nxt); todo.append(path + [nxt])
print("cycles through changed modules:", bad); sys.exit(1 if bad else 0)
PYEOF
python3 "$CHK/cycle_check.py" . $PY
```

`NOT PARSED` means host 3.9 cannot read newer syntax in that file: run the script with the repo's python.
It sees import-time imports only; check #5 is the real proof, this one names the path of the cycle.

## 7. Function-local and private cross-module imports

```bash
cat > "$CHK/import_rules.py" <<'PYEOF'
"""import_rules.py IMPORT_ROOT TOP_PKG FILE.py... : function-local project imports and private cross-module imports.
TOP_PKG = the project's top package (e.g. `src`). With BASE=<rev> in the environment only lines added since BASE
are judged. Exit 1 on any hit."""
import ast, os, re, subprocess, sys
from pathlib import Path
root, top, hits = Path(sys.argv[1]).resolve(), sys.argv[2], 0
def private(part): return part.startswith("_") and not part.startswith("__")
def added(f):
    if not os.environ.get("BASE"):
        return None
    d = subprocess.run(["git", "diff", "-U0", os.environ["BASE"], "--", f], capture_output=True, text=True).stdout
    return {i for a, b in re.findall(r"^@@ -\S+ \+(\d+)(?:,(\d+))? @@", d, re.M) for i in range(int(a), int(a) + int(b or 1))}
for f in sys.argv[3:]:
    p = Path(f).resolve()
    parts = list(p.relative_to(root).with_suffix("").parts)
    pkg = parts[:-1]  # the file's own package; an __init__ is its own package
    in_top = parts[0] == top  # the lazy rule is for the app package only; tests and scripts may import lazily
    tree, new = ast.parse(p.read_text(encoding="utf-8")), added(f)
    in_def = {id(n) for d in ast.walk(tree) if isinstance(d, (ast.FunctionDef, ast.AsyncFunctionDef))
              for n in ast.walk(d) if isinstance(n, (ast.Import, ast.ImportFrom))}
    for n in ast.walk(tree):
        if not isinstance(n, (ast.Import, ast.ImportFrom)) or (new is not None and n.lineno not in new):
            continue
        level = getattr(n, "level", 0) or 0
        mod = (pkg[:len(pkg) - level + 1] if level else []) + ((n.module or "").split(".") if getattr(n, "module", None) else [])
        targets = [a.name.split(".") for a in n.names] if isinstance(n, ast.Import) else [mod + [a.name] for a in n.names]
        for t in targets:
            if t[0] != top:
                continue
            if id(n) in in_def and in_top:
                hits += 1; print("%s:%d FUNCTION-LOCAL import %s (import at top; if it cycles, move shared code down a layer)" % (f, n.lineno, ".".join(t)))
            i = next((k for k, x in enumerate(t) if private(x)), None)
            if i is not None and pkg[:i] != t[:i]:
                hits += 1; print("%s:%d PRIVATE import %s (make it public where it lives, or move it to a shared module)" % (f, n.lineno, ".".join(t)))
print("import-rule hits:", hits); sys.exit(1 if hits else 0)
PYEOF
BASE="$BASE" python3 "$CHK/import_rules.py" . src $PY      # second arg = top package name
```

With `BASE=` set it judges only lines you added. Without it, it lists every hit in the files: those are
pre-existing, report them, do not fix them in this change.

## 8. Silencing

```bash
git diff "$BASE" -- '*.py' | grep -nE '^\+.*#\s*(noqa|type:\s*ignore|ruff:\s*noqa|pylint:\s*disable|pragma:\s*no cover)'
echo "$CHANGED" | grep -E '(^|/)(ruff\.toml|\.ruff\.toml|pyproject\.toml|setup\.cfg|\.importlinter|mypy\.ini|.*baseline.*|scope_allow\.txt)$'
```

Both must print nothing. A `pyproject.toml` hit is fine only when no lint section changed (`git diff "$BASE" -- pyproject.toml`).

## 9. Literals that already have a constant

Pass the feature folder (or `src`) as the scan root; the diff on stdin.

```bash
cat > "$CHK/literal_check.py" <<'PYEOF'
"""literal_check.py SCAN_DIR < git-diff : added lines that re-type a literal a module-level UPPER_CASE constant names.
Each hit: import the constant, or say in the handoff why this value is a different concept. Exit 1 on hits."""
import ast, re, sys
from pathlib import Path
homes = {}
for p in Path(sys.argv[1]).rglob("*.py"):
    if any(x.startswith(".") or x in ("venv", "node_modules") for x in p.parts):
        continue
    try:
        body = ast.parse(p.read_text(encoding="utf-8")).body
    except (SyntaxError, UnicodeDecodeError):
        continue
    for n in body:
        if not isinstance(n, ast.Assign) or len(n.targets) != 1:
            continue
        t, val = n.targets[0], n.value  # `A = "x"` and `A, B = "x", "y"`
        pairs = zip(t.elts, val.elts) if isinstance(t, ast.Tuple) and isinstance(val, ast.Tuple) else [(t, val)]
        for name, c in pairs:
            v = c.value if isinstance(c, ast.Constant) else None
            # ponytail: strings (>= 3 chars) and fractional floats only; ints are too common to judge by grep
            if isinstance(name, ast.Name) and name.id.isupper() and (
                    (isinstance(v, str) and len(v) >= 3) or (type(v) is float and v != int(v))):
                homes.setdefault(v, set()).add("%s:%s" % (p, name.id))
pats = {v: re.compile(r"""(['"])%s\1""" % re.escape(v) if isinstance(v, str) else r"(?<![\w.])%s(?![\w.])" % re.escape(repr(v)))
        for v in homes}
cur, hits = "", 0
for line in sys.stdin:
    if line.startswith("+++ "):
        cur = line[6:].strip(); continue
    code = line[1:].split("#")[0]
    if not line.startswith("+") or line.startswith("+++") or re.match(r"\s*[A-Z][A-Z0-9_, ]*=", code):
        continue
    for v, rx in pats.items():
        if rx.search(code):
            hits += 1; print("%s: %r  ->  already named %s" % (cur, v, ", ".join(sorted(homes[v]))))
print("literal hits:", hits); sys.exit(1 if hits else 0)
PYEOF
git diff "$BASE" -- '*.py' | python3 "$CHK/literal_check.py" src/features/<feature>
```

Each hit: import the constant, or name it in the handoff as a different concept that happens to share the
value. Also grep by hand for the one value you just made a constant: `grep -rn "'<value>'" src`.

## 10. Layer direction (added lines only)

```bash
added() { git diff "$BASE" -- "$@" | grep -nE '^\+\s*(from|import) '; }
added '*/repos/*.py'   | grep -E '[. ](engine|service|services|routes|api)([. ]|$)'           # repo -> rule/service/api
added '*/engine/*.py'  | grep -E '[. ](repos|storage|service|services|routes|api)([. ]|$)'     # engine is pure
added '*/models/*.py'  | grep -E '[. ](repos|storage|engine|service|services|routes|api)([. ]|$)|fastapi|sqlalchemy|httpx'
added '*/service/*.py' | grep -E '[. ](routes|api)([. ]|$)|fastapi|HTTPException'             # service -> api
```

All must print nothing. A cross-feature import must name the other feature's public module, never its
`repos/` or `api/`.

## 11. Tests fail by value first

```bash
# before the src change (or with the stub that returns today's behaviour):
<repo test command> path/to/test_new.py 2>&1 | grep -E 'assert|Error' | head -5
```

Paste the `assert` line (expected vs got) into the handoff. `ImportError`, `TypeError`, `KeyError`,
`AttributeError`, `NameError` there = shape failure: fix the test until it fails on a value. Then run the
repo's full suite once (its own command: `make test`, `make check F=<f>`, the Docker suite).

## 12. Docs name every added or moved thing

```bash
for f in $(git diff --name-only --diff-filter=A "$BASE" -- '*.py'); do
  d=$(dirname "$f"); n=$(basename "$f" .py)
  grep -qs "$n" "$d/README.md" "$d/../README.md" || echo "not in a README: $f"
done
git diff --name-only --diff-filter=R "$BASE"   # renamed: grep the docs for the old path too
```

A changed route, DTO field, memo or SQL file: `grep -rn "<name>" docs */docs **/README.md` and update
every hit in the same commit.
