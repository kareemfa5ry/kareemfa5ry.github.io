# Sources, borrowed rules, repo facts, and conflicts

"devkit" = `retail-edge-devkit/`.

## Borrowed from the devkit (each one line, with its source)

Structure and layers:
- DTO / domain modules import only pydantic and stdlib; no fastapi, sqlalchemy, httpx in them (devkit `.github/instructions/codeReview.instructions.md`, "Dependency Direction").
- Routes hold no logic and no SQL; services raise no `HTTPException` and take no `Request`; routes map domain errors to status codes (codeReview, "Layering" + "Error handling").
- A package exposes a stable `__init__` facade so internal splits never ripple to callers (devkit `AGENTS.md`, "Working agreements").
- Test files mirror the modules they cover (devkit `AGENTS.md`, "Working agreements").
- No `utils.py` / `helpers.py` grab-bags (codeReview, "High Cohesion").
- No module-level engines, sessions, clients or mutable singletons as hidden state; config through `Settings`, not scattered `os.getenv` (codeReview, "D - Dependency Inversion"). This is why a cache lives in the one memo home with a reset hook.
- `@lru_cache` on instance methods leaks across requests: do not add more (codeReview, "D").
- A growing `if kind == ...` chain: a dict registry or a `StrEnum`; bare string discriminators become constants (codeReview, "O - Open/Closed").
- External systems (Frontier, Redash, the AI provider) only through their adapter, never an SDK/HTTP call inside business logic (codeReview, "Polymorphism / Pure Fabrication").
- No blocking I/O in an `async def` route; backend DB access is synchronous (codeReview, "Async").
- Every `except` re-raises, or logs and returns an explicit failure; keep the cause with `from e` (codeReview, "Error handling").

Scope and honesty:
- Never mix a refactor into a bug fix; change only the files the request needs (devkit `AGENTS.md`; `.github/copilot-instructions.md`, "Scope discipline").
- Say whether you reproduced a legacy quirk or fixed it; a cap that truncates returns the true count too; a test that cannot fail is worse than none (devkit `AGENTS.md`, "What the rewrite taught us").
- A rule that lives only in prose drifts: a rule earns a checker (same section). This skill's checks.md is that checker.
- Never log row data, credentials or PII; no secrets in code, YAML or committed `.env` (devkit `AGENTS.md`).

SQL:
- SQL lives in `repos/queries/*.sql` (kebab-case), loaded with `load_sql`, values bound as `:param`; never f-string / `%` / `.format` SQL; no `SELECT *` (codeReview, "Data access & SQL").
- Never invent a column: verify against the source the tree reads (live store schema for corp; `retail-edge-sync/config/table_catalog.yaml` for the mirror) (devkit `AGENTS.md`).

## Repo facts to check before placing code

| Repo | Layout | SQL dialect | Source |
|---|---|---|---|
| `retail-edge-backend` (frozen 09-09; work only on a branch the brief names) | `src/features/<f>/{routes,service,repos,models}` (+ `engine/` for pure rules), `repos/queries/*.sql`; scripts under `scripts/endpoint_capture/<feature>/` with `__main__.py`, `entry_points/*.sh`, README | **T-SQL** on the mirror: `TOP`, `ISNULL`, `SYSDATETIME()`; no backticks, `LIMIT`, `IF()`, `%%`; rows by `store_number` | devkit `.github/instructions/backend.instructions.md`; atlas `references/repos.md` |
| `retail-edge-corp` (the product) | `backend/features/<f>/` (`api/routes.py`, `api/dto.py`, `model.py`, `storage/<x>_store.py`, `<f>_service.py`, `tests/`, facade `__init__`) + `backend/core/`; nothing new at `backend/` root (root names are shims: import the real module) | **MySQL/MariaDB** through `db.run_query*`, `%s` params, literal `%` as `%%`, `Facility_Id` filters; never alias a column `lines`/`line`/`rank`/`rows`; text `LIKE` with `LOWER()` | devkit `.github/instructions/corp.instructions.md`; atlas |
| `retail-edge-sync` | `redash/ -> transform/ -> sinks/`; SQL only from `config/table_catalog.yaml` | T-SQL sink | devkit `.github/instructions/sync.instructions.md` |
| `retail-edge-ui`, `old/` | frozen reference / retired: never extend `ui`, never read `old/` | | devkit `AGENTS.md`, `legacy-reference.instructions.md` |

Safety facts that decide placement:
- No live Frontier writes from any run. corp: a new Frontier call goes through `run_app` and is catalogued NOT_CONFIRMED in the same commit (atlas `references/repos.md`); backend: through the `core/` Frontier gateway, never raw `httpx` in a service (codeReview, "Layering").
- corp order math is guarded: never touch `_round_to_packs`; a change to the flow/stockup family owes the order-math pins plus a measured backtest (devkit `corp.instructions.md`, "Non-negotiables").
- corp worktrees live in `corp.worktrees/<name>`, never inside the repo (devkit `corp.instructions.md`).

## Conflicts and the mastermind's rulings (10-16)

Both texts verbatim; the skill body says the ruled version.

| # | Topic | Rule block / project text | Devkit text | Ruling |
|---|---|---|---|---|
| 1 | Module size | "New modules ≤400 lines." (rule block, MODULARIZATION) | "One concern per file, ~250-line soft ceiling ... Crossing the ceiling is allowed only for one cohesive algorithm with the reason stated in the module docstring." (devkit `AGENTS.md`, Working agreements); "Flag any module >**300 lines** or class >**200 lines** as a decomposition candidate." (devkit `codeReview.instructions.md`, Cohesion & Coupling) | 400 is the cap (repo_guard enforces it); 250/300 is a target: "aim under 300, never over 400" |
| 2 | A file already over the cap | "A file of ours already over 400 lines must not grow (net); extract instead." (rule block) | "When a file you're extending is already over the bar, split it as part of the change — except in `corp/`" (devkit `AGENTS.md`); "extending one by a little is normal; rewriting one mid-feature is not." (devkit `corp.instructions.md`, Non-negotiables) | never grows net; extract instead (rule block kept) |
| 3 | Function size / arguments | "ruff C901/PLR09 limits respected by extracting" (rule block, STRICT LINT) | "Flag any function >**40 lines** or with >**6 parameters** as an extraction candidate." and "more than **7 injected dependencies**" (devkit `codeReview.instructions.md`) | what ruff enforces in the repo (C901, PLR09xx as configured) is the law, met by extracting, never silencing; the devkit numbers are guidance only where ruff does not enforce them |
| 4 | One feature importing another's service | "daily_service.py:36-39 (service -> parity engine/service modules): ALLOWED. That is the layer direction" (design audit ruling) | "Flag: one feature slice importing another feature's `repos/` or `service/` internals. Share via `core/`, `utils/`, or a cross-feature module." (devkit `codeReview.instructions.md`, Module Boundaries) | allowed in the layer direction to the other feature's PUBLIC facade/service/engine module; never its repos, models internals or `_names`; a repo never imports engine or service. The devkit flag stays as a prompt to check the import is the public surface |
| 5 | READMEs and docs | "A feature folder (scripts/endpoint_capture/<feature>/) has __main__.py, entry_points/*.sh and a README; README references stay valid." (rule block, FOLDERS) | "Don't create README/docs/summary files unless asked." (devkit `.github/copilot-instructions.md`, Scope discipline) | the folder README is updated whenever a module is added or an entry point changes (rule block kept). Trial fix 10-16: a `src/` folder with no README gets none (docstring + API map); `scripts/<feature>/` README is mandatory |
| 6 | Tests first | "Write the tests first; they must fail on the old code." (rule block, BEFORE WRITING CODE) | "Do not write or run tests unless explicitly asked." (devkit `sync.instructions.md`, item 10) | tests fail by value first in our repos; "no tests unless asked" applies only inside `retail-edge-sync` (that team's rule) |

## Most likely to break

From the Haiku trials (10-16); the countermeasure names the SKILL.md step.

- **One home**: a second helper/cache under a new name, or one more private copy. Countermeasure: A3's greps in HOME; rule 4's private-copies clause (make ONE public helper, list the old copies under OPEN).
- **Placement**: a leaf inside a package whose `__init__` is heavy, so a reader's interpreter cannot import it. Countermeasure: A2's reader-import check, run in each reader's interpreter.
- **Layers**: a rule value or another feature's internals reached the wrong way. Countermeasure: IMPORTS line.
- **Tests first**: an ImportError counted as "failing". Countermeasure: A6 (ImportError + stub + one wrong version per branch, asserts pasted).
- **Words carrying a ruling**: clauses dropped. Countermeasure: A1, one RULING line per clause, met or not.
- **Root-level helpers / re-derived facts** (trial 3): a helper at the `src/` root; a leaf re-deriving a fact a DTO field already carries; `lead_days` worded as 'lands in'. Countermeasures: A1 (SAME meaning), rule 4 (`src/shared/`, never the app root), A3 (take the derived DTO field).
