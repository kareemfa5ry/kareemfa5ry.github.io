# Naming

A name tells the reader what the thing owns, so they find its one home without reading it.

## Conventions

- **Modules** snake_case, named by the noun they own, with the layer suffix the folder uses:
  `<noun>_repo.py`, `<noun>_service.py`, `<noun>_dto.py`, `<area>_api.py`, `<area>_words.py`. One noun per
  module; if you need "and" in the name, it is two modules.
- **Folders** snake_case, the same name in src, tests and docs (`stockout_recovery/` everywhere).
- **Functions** start with the verb: `read_` (repo), `decide_` / `compute_` (engine), `build_` (DTO or
  test data), `render_` / `*_words` (user text). A name with `and` does two things: split it
  (devkit `codeReview.instructions.md`, "Single Responsibility").
- **Booleans** read as a yes/no question: `is_late`, `has_open_order`.
- **Constants** UPPER_CASE, defined once in the module that owns the concept, imported everywhere else.
  A set of string values (statuses, bases, kinds) is one set of constants or a `StrEnum`, never bare
  literals compared in several files (devkit `codeReview.instructions.md`, "Open/Closed").
- **Private** `_name` means "only this module uses it". The moment another module needs it, rename it
  public in its home; never import a `_name` from elsewhere.
- **SQL and data files** kebab-case (`late-open-orders.sql`). Once committed they are frozen: a change is a
  new file `<name>-v2.sql` (then `-v3`), and the reader switches to it in the same commit.
- **Plain names, never codes**: name rules by what they do (`stockout_recovery`), not by a ticket or a
  letter code (`r7`, `b3`, `wp22`). Never a store, customer or tenant number in a name.
- **Tests** `test_<module>.py` beside the tree they cover; functions `test_<behaviour>_when_<condition>`.

## Ten good / bad pairs

| # | Bad | Good | Why |
|---|---|---|---|
| 1 | `utils.py` holding a date helper, a SQL builder and a sentence | `store_day.py`, `late_orders_repo.py`, `late_order_words.py` | one noun per module; grab-bags have no home |
| 2 | `def orders(store)` | `def read_late_open_orders(store, as_of, window)` | verb first; the noun says which orders |
| 3 | `def fetch_and_store(...)` | `read_lines(...)` + `save_snapshot(...)` | "and" = two concerns |
| 4 | `if p["basis"] == "recorded":` | `if p["basis"] == run_slop.RECORDED:` | the vocabulary has one home; a literal drifts |
| 5 | `timedelta(seconds=120)` typed in a repo | `late_window` parameter; `LATE_WINDOW` in the engine | the rule's value lives with the rule |
| 6 | `from .slop_service import _repos` | rename to `repos_for(...)` in `slop_service`, import that | private means this module only |
| 7 | editing `late-open-orders.sql` after it was committed | adding `late-open-orders-v2.sql` and pointing the repo at it | committed read sets are evidence; never rewrite them |
| 8 | `rule_290.py`, `if store in {290, 611}:` | `one_pack_note.py` + a per-store setting that can turn it off | logic is for every store; stores are data |
| 9 | `r7_check.py`, `wp22_confidence.py` | `stockout_recovery.py`, `confidence.py` | plain names; codes mean nothing next year |
| 10 | `def _make_line()` in `test_a.py`, imported by `test_b.py` | `build_draft_line()` in `tests/unit/<area>/builders.py` | shared test helpers are public and have one home |
