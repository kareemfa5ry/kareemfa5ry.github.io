---
name: fable-code
description: Write code the way Fable (the mastermind reviewer) enforces structure, so a design review finds nothing structural. Ten checkable rules (one concern per module, 400-line cap, 8 loose modules per folder, layers, one home per concept, no import cycles, no private or function-local imports, no lint silencing, entry points, docs and naming) plus a before / while / before-commit procedure with exact commands. Use it for EVERY code change in any repo (new module, edit, fix round, test, script, SQL), especially when a brief says "fable-code", "rule block", "no drift", "modular", "lint-strict" or "codebase-design", and before handing code back for review.
---

# fable-code

Write it so the reviewer has nothing structural to say. Every rule below has a number or a command, so you
can check it yourself before you hand off. Plain rule: **if you cannot meet a rule, STOP and report it. Never
silence it, never bend the layout to fit.**

Authority: the brief > the repo's rules file (`CLAUDE.md`, `AGENTS.md`, `.github/copilot-instructions.md`) >
this skill; a stricter repo wins. Repo facts (layouts, SQL dialects, Frontier safety): [sources.md](references/sources.md).

**Applies to** any code change (src, tests, scripts, SQL, entry points), a one-line fix too. Pair it with
`ponytail` and `codebase-design`; neither excuses breaking a rule here.

## The 10 rules

1. **One concern per module, at most 400 lines.** A module owns one noun (one rule, one read, one DTO set).
   New modules: aim under 300, never over 400. A file of ours at or under 400 never crosses 400. A file
   already over 400 never grows (net lines): put the new code in a new module and call it. No grab-bags (`utils.py`,
   `helpers.py`, `misc.py`, `common.py` holding unrelated things).
2. **At most 8 loose modules per folder.** Loose = a `.py` directly in the folder, except `__init__.py`,
   `__main__.py`, `conftest.py` (test files count). Count BEFORE adding a file. Folder at 8 or more: add
   nothing loose; put the module in a subpackage that fits the layout (`reasons/<rule>/`, `repos/<area>/`).
3. **Layers point one way.** `api (routes) -> service -> engine | repos -> queries/*.sql`; `models` (DTOs)
   are imported by any layer and import none of them. Never the reverse: a repo never imports service,
   engine or api; an engine never imports repos or service (it is pure: data in, decision out); a service
   never imports api. A rule's constant lives with the rule (engine/service); the service PASSES it to the
   repo as an argument. Another feature: a service may import its PUBLIC facade, service or engine module
   (layer direction); never its repos, its models' internals or a `_name`.
4. **One home per concept.** Before writing a function, constant, SQL read, memo/cache, template of user
   words or test helper, SEARCH for it (`grep -rn` the name, the literal, the table, the words). Found:
   reuse or extend it there. Found only as private copies (`_days`, `_count`, inline `'s' * (n != 1)`) in
   other modules? Do not add another private copy: create ONE public helper in its own light module named for
   it (`count_words.py`) in the repo's light shared package (`src/shared/`; create it with a docstring-only
   `__init__` when `shared/`, `core/` and `utils/` all have heavy `__init__`s), never inside your feature's
   module. Never add a loose module at the app root (`src/`, `backend/`): it holds app wiring only (main,
   config, errors). If a public copy exists where src cannot import
   it (`scripts/`), move it down into src with its name and full signature (e.g. `plural(n, one, many=None)`) so
   each old copy can be swapped one for one. List every copy with path:line under OPEN; greps: `def plural`,
   `def _days`, `'s' * (`, `'s' if`, `else 's'`. Use it in your change; do not edit the owners' files. Not found: create exactly one home ([references/placement.md](references/placement.md)).
   No parallel helper, no second cache, no copied sentence. No per-tenant/per-store constants or sets in
   code (`{290, 611}`): that is data or settings; logic is for every store.
5. **No import cycles.** Every changed module imports alone in a fresh process, and `cycle_check.py`
   reports 0 cycles ([references/checks.md](references/checks.md) #5, #6). If one cycles: move the shared
   code DOWN a layer (into models/engine/a shared module). Never hide it with a function-local import.
6. **No function-local and no private cross-module imports.** In the app package (`src/`), project imports go
   at module top (tests and host scripts may import lazily). Never
   `from x import _name`, `import a._b` from another module, tests included: make the name public where it
   lives, or move it to a public helper (`tests/<area>/builders.py`). Own package's `_bootstrap` is fine.
7. **No lint silencing.** No `noqa`, `type: ignore`, `ruff: noqa`, `pylint: disable`, no edits to
   `ruff.toml` / `pyproject` lint sections / `.importlinter` / baselines / allow lists. Whatever ruff
   enforces in the repo (C901, PLR09xx as configured; here complexity 10, returns 6, branches 12, args 5,
   statements 50) is the law: extract a function or a small dataclass argument. No line over the repo's line length (120 in retail-edge-backend); never join lines to fit.
8. **Entry points.** One documented entry per feature. CLI/scripts live under `<feature>/entry_points/*.sh`
   (thin: `exec python3 "$ROOT/<feature>" <cmd> "$@"`) and run through the feature's `__main__.py`;
   `__main__` and `if __name__ == "__main__":` only there. Logic stays in python modules, never in `.sh`.
   A new route is registered where its siblings are (router module + app registration).
9. **Docs move with the code.** Added/moved/renamed a module: update the folder's `README.md` (table of
   modules or commands). Changed a route, a DTO field, a memo/cache, or an SQL file: update the API map /
   doc that names it in the same commit. Never leave a doc naming a path that no longer exists.
   No README in the folder: in `src/` do not create one (the module docstring names its readers; the area's
   API map gets a line only when a route, DTO field, memo or SQL file changes); in `scripts/<feature>/` the
   README is mandatory, create it.
10. **Names say what they own.** snake_case modules named by the noun they own (`late_open_orders_repo.py`);
    functions by the verb (`read_late_open_orders`); constants UPPER_CASE in one module and imported, never
    re-typed as literals; SQL files kebab-case; committed `.sql` / versioned data files are NEVER edited:
    add `<name>-v2.sql` (next free number) and point the reader at it. Plain names, never codes (`r7.py`).
    Follow the area's existing suffix convention (e.g. `*_words`). Details: [naming.md](references/naming.md).

## Procedure

### A. Before writing (no src edit yet)

1. Read the repo's rules file and the README of the folder you will touch. Open one sibling module that
   does the same kind of thing; copy its shape (imports, signature style, docstring, test layout).
   User-facing words that carry a user ruling: open the ruling the brief names (memory file or doc), list every
   clause it requires of the sentence, and map clause -> sentence part in the handoff; a clause the brief's
   inputs cannot carry goes under OPEN, never silently dropped. The brief's input list is not the ruling: a
   clause with no input field (a cost, a source name, a window, a rule name) is still a clause and gets its
   RULING line. Each RULING line maps a clause to an input with the SAME meaning. A parameter named for one
   quantity (`lead_days`) is never worded as another ('lands in'). A ruling's 'nothing' outcome (the next run
   would not order or land it) is a branch or an OPEN line. A count the ruling splits three ways (prevented / brought forward / idle) is never folded into
   two buckets: name the missing bucket under OPEN. Counts that must add up are checked or derived.
2. Place it with the decision table and worked examples in [placement.md](references/placement.md).
   Importing `pkg/mod.py` runs `pkg/__init__.py` first. Never put a leaf (words, constants, a pure helper) in a
   package whose `__init__` imports repos, services or other features. Every intended reader must be able to
   import it in its own interpreter (retail-edge-backend: `scripts/endpoint_capture` runs on host python 3.9, so
   `python3 -c 'import src.<module>'` from the repo root must succeed), and no intended reader may be imported by
   that package's `__init__` (that is a cycle waiting for the first caller).
3. MANDATORY search before any helper (rule 4): `grep -rn` the concept's nouns AND the table/columns/data it
   reads, in src, tests, scripts. Write down the greps and "home of <concept> = <path> (reused | new)".
   Grep the DTO / response fields that already carry the derived fact (`is_dc`, `facility_name`, `status`),
   not only the constant behind it. A leaf takes the derived field as its input. It never re-derives from a
   raw code, and it never asks its caller to map a code (that is a second home).
4. List the readers of every field, function, constant or SQL column you change:
   `grep -rn "<name>" src tests scripts docs`. Each reader is updated in this change or named as untouched
   on purpose. A new function has no readers yet: list the INTENDED readers the brief or ruling names (e.g.
   the WHY builder, the dealer Excel) and run check #5 in each reader's interpreter, not just the test image.
5. Record BEFORE counts: line counts of files you will touch, loose-module counts of folders you will add
   to (checks.md #2, #3).
6. Tests first: write the test through the public interface and run it on the BASE code. A test that fails
   with ImportError does not count; on the base it must run and fail on a VALUE (an `assert`, expected vs
   got). A new function cannot fail by value on the base (it fails at import: say so in TESTS). The proof that
   counts: (a) the tests against a stub returning today's behaviour (every test fails by value), and (b) the
   tests against one plausible wrong version per branch (always plural, no validation, a clause dropped):
   paste one failing assert per mutant. A stub alone proves only that the tests can fail. New test folders
   carry the `__init__.py` their siblings have; absolute `from src.` imports only where the package already
   uses them. (Inside `retail-edge-sync` only, that team's "no tests unless asked" wins.)

### B. While writing

- Stay in the files you listed; one concern; never refactor unrelated code or mix a refactor into a bug fix.
- Limits as you go: 400 lines, 8 loose, ruff's limits, line length. A name another module needs is public;
  a constant you need is imported. A file over 400: new behaviour goes in a new module, one call line.

### C. Before committing (all must pass; commands in [references/checks.md](references/checks.md))

| # | Check | Pass when |
|---|---|---|
| 1 | changed-file list (`BASE` set) | you know every file you touched |
| 2 | sizes before -> after | no FAIL line (over 400 and grew) |
| 3 | loose modules before -> after | no FAIL line (over 8 and grew) |
| 4 | ruff with the repo config on changed files; `make lint-strict` (or the PLR09 diff) if the repo has it | clean / "none new or worse" |
| 5 | fresh-process import of each changed module (repo's python or test image) | every module imports |
| 6 | `cycle_check.py` | 0 cycles |
| 7 | `import_rules.py` | 0 hits on lines you added |
| 8 | silencing grep (noqa, type: ignore, lint config files) | empty |
| 9 | `literal_check.py` | 0 hits, or each one named in the handoff as a different concept |
| 10 | layer grep (repos importing engine/service, engine importing repos) | empty |
| 11 | tests: the new ones failed by value on the old code, pass now; the repo's suite passes | yes |
| 12 | docs: README / API map names every added or moved module, route, memo | yes |

### D. Handoff (what you report, nothing else)

```
HOME     <concept> -> <path> (reused|new); greps run: <nouns + data read>
IMPORTS  every new import line: <file:line> <from layer> -> <to layer> (e.g. service -> engine)
FILES    <path>  <before> -> <after> lines  [>400]         every touched file
FOLDERS  <path>  <before> -> <after> loose                 every folder you added to
READERS  <field/name> -> <readers updated | untouched + why>
RULING   <clause> -> <sentence part> | OPEN: needs <input/decision>   one line per clause of the ruling, met or not
TESTS    failed on base: <assert line> (new function: ImportError + stub + 1 assert per mutant); now: <N passed>
CHECKS   ruff ok | lint-strict <its line; not run = FAIL> | imports <N> ok | cycles 0 | import rules 0 | silencing 0 | literals <N + why>
DOCS     <README / map lines changed>
OPEN     <any rule not met, and why> (never silenced)
```
Sources, borrowed rules, the six rulings and the most-likely-to-break list: [sources.md](references/sources.md).
