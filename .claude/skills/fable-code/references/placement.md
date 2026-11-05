# Placement: this kind of code goes here

Layout this table assumes (one folder per feature, same snake_case name everywhere):

```
features/<f>/
  __init__.py        small public interface (what other features may import)
  api/               HTTP: routes, request parsing, error -> status mapping      (retail-edge-backend: routes/)
  service/           orchestration: call repos, call rules, shape the answer     (corp: <f>_service.py)
  engine/            pure rules and calculations: data in, decision out, no IO
  repos/             data access only; repos/queries/*.sql holds the SQL          (corp: storage/)
  models/            DTOs and row shapes; imports nothing from the feature but other models
  entry_points/      thin *.sh wrappers for CLIs (scripts features: next to __main__.py + README.md)
  tests/             mirrors the module tree; helpers in public builders.py      (backend: tests/unit/<area>/)
shared/ or core/     the only code two features both import (clock, db client, words used by 2 features)
```

Import direction: `api -> service -> engine | repos`; everyone may import `models` and `shared/core`.
Nothing imports `api`. A repo never imports `engine` or `service`. An engine never imports `repos`.

## Decision table

| You are adding | It goes in | It never goes in |
|---|---|---|
| an HTTP route | `api/<area>_api.py` (or `routes/`), one service call per route | service, repos |
| orchestration of a use case | `service/<area>/<noun>_service.py` | api (no logic there), repos |
| a rule / decision / calculation | `engine/<rule>.py` or `service/<rules>/<rule>/<rule>.py`, pure, constants at its top | repos, api, a `utils.py` |
| a SQL read or write | `repos/queries/<noun>.sql` (new file) + one function in `repos/<area>/<noun>_repo.py` | inline SQL in a service; an edited committed `.sql` |
| a value a rule needs at query time | constant in the rule's module; the service passes it to the repo function | imported by the repo |
| a cache / memo | the feature's ONE memo home (`service/<area>/memo/`), with one reset hook for tests | a module-level `_MEMO = {}` in a service |
| a DTO / response shape | `models/<area>/<noun>_dto.py` | inline dicts returned from a route |
| words a user reads | the area's one `<area>_words.py` (templates as named functions or constants) | an f-string in a rule module |
| a constant used by 1 feature | the module that owns its concept (rule constant in the rule) | re-typed as a literal anywhere |
| a constant used by 2+ features | `shared/` or `core/` | copied into each feature |
| a CLI | `entry_points/<cmd>.sh` + `<cmd>.py` dispatched by the feature's `__main__.py`; README row | logic in the `.sh` |
| a test helper | `tests/<area>/builders.py` (public names) | `_private` helpers imported across test files |
| per-store / per-tenant behaviour | a setting or data row read at runtime | `if store in {290, 611}` in code |

A feature that grows past ~3 sibling modules for one sub-topic gets its own subpackage with a small
`__init__`. Folder already at 8 loose modules? Before adding, make or use a subpackage named for the sub-topic
(`service/reasons/stockout_recovery/`), and say so in the handoff.

**Importability.** Importing `pkg/mod.py` runs `pkg/__init__.py` first. Never put a leaf (words, constants, a pure
helper) in a package whose `__init__` imports repos, services or other features. Every intended reader must be able
to import it in its own interpreter (retail-edge-backend: `scripts/endpoint_capture` runs on host python 3.9, so
`python3 -c 'import src.<module>'` from the repo root must succeed), and no intended reader may be imported by that
package's `__init__` (that is a cycle waiting for the first caller). Check it before writing, from the repo root:

```bash
sed -n '1,60p' src/features/<f>/service/<pkg>/__init__.py      # heavy imports here = wrong home for a leaf
python3 -c 'import src.features.<f>.service.<pkg>.<module>'     # host 3.9: the interpreter the dealer Excel uses
```

General rule: a leaf (words, constants, a pure helper) that a host-run script must import lives in its own light
subpackage (an `__init__` that imports nothing heavy) or beside modules the scripts already import, never in a
feature package whose `__init__` pulls repos, services or other features. Illustration (trial 10-16): a words leaf put
in `service/flow_adds/` failed on host 3.9 because that `__init__` imports `reasons.adds` and `daily_service`; and
`reasons/adds.py` importing it would have cycled. Decide the home for YOUR leaf by running the two commands above.

## Eight worked examples

1. **A new SQL read** ("late open orders for a store"). Search `repos/queries/` for the table first. None:
   add `repos/queries/late-open-orders.sql`, add `read_late_open_orders(store, as_of, window)` to
   `repos/orders/late_open_orders_repo.py`. The window is a rule value, so the service passes it in.
   A change to that SQL later is a new `late-open-orders-v2.sql`; the repo points at it.
2. **A new rule** ("stockout recovery"). `service/reasons/stockout_recovery/` (its own subpackage: the
   `reasons/` folder is full). `decide(line, facts) -> Verdict`, pure; its thresholds are UPPER_CASE
   constants at the top of the same module. Tests call `decide` with built facts.
3. **A new memo** (cache the store scan for one request). Open the feature's memo home
   (`service/flow/memo/`), add a named cache there next to the others, register it with the one reset
   hook. Every reader of the scan reads through it: no second, uncached scan elsewhere.
4. **A new words helper** (the sentence that explains a late order). If the words carry a user ruling, open
   it first and map each clause to a sentence part (SKILL.md A1). Search the area's `*_words.py` for
   the sentence's key words first. Add `late_order_words(qty, days)` there. A rule returns facts; the
   words module turns facts into the sentence. Two features need it: move it to `shared/`.
5. **A new CLI** (`prune` for nightly results). `forecasting/prune.py` holds the logic,
   `forecasting/__main__.py` dispatches `prune`, `forecasting/entry_points/prune.sh` is two lines
   (`set -eu`, `exec python3 "$ROOT/forecasting" prune "$@"`), the README gets a table row.
6. **A new DTO** (lane rows for a route). `models/flow/lane_row_dto.py`, pydantic/dataclass fields only,
   validation of shape at most. No business rule, no fastapi/sqlalchemy import.
7. **A shared constant** (the late window, 120 s). It belongs to the rule that uses it:
   `engine/truth/list_attribution.py: LATE_WINDOW`. The service imports it and passes it to the repo;
   every other module that needs the value imports the name.
8. **A test helper** (build a draft line). `tests/unit/<area>/builders.py: build_draft_line(**over)`,
   public name. Tests import it; nobody imports a test file's `_make_line`.

