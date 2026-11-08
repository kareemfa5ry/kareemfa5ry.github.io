# Agent rules

- Every code change (Astro, CSS, scripts, workflows, LaTeX build, a one-line fix too) follows the `fable-code`
  skill in `.claude/skills/fable-code/SKILL.md`: its 10 rules while writing, its before-commit checks, its
  handoff block. A stricter rule here wins.
- Pair it with the `ponytail` skill in `.claude/skills/ponytail/SKILL.md` (MIT, vendored): the laziest solution
  that works, reuse before stdlib before platform before dependency before new code. fable-code governs shape and
  wins on any conflict; ponytail governs size. Mark deliberate shortcuts with a `ponytail:` comment.
- Two more skills ship with the repo: `orchestrator` (`.claude/skills/orchestrator/SKILL.md`: a Fable or Opus
  session plans and delegates to Haiku / Sonnet / Opus workers by severity, protects its own context) and
  `plain-english` (`.claude/skills/plain-english/SKILL.md`: explanations a reader outside software can follow).
  Use the orchestrator for any multi-step task; it still routes every code change through fable-code.
- `resume-update` (`.claude/skills/resume-update/SKILL.md`): use it for any change to the resume, CV, a role, project,
  skill, education, contact or what the chatbot knows; it maps each fact to its file and the run order.
- Pull requests: one feature each. NN is the number GitHub gives the PR: branch `feature/NN-short-name` (or
  `chore/NN-...`, lowercase), title `NN: <the feature it adds>`. Before cutting the branch, `git fetch origin main`
  and predict NN (the next issue or PR number, as other people merge too):
  `gh api 'repos/kareemfa5ry/kareemfa5ry.github.io/issues?state=all&per_page=1' --jq '.[0].number + 1'`.
  GitHub gave a different number: rename the branch and the title to it. Enforced by `scripts/check_pr_name.mjs`:
  the pre-push hook checks the branch format, the required CI job `check` fails a PR whose number, title and branch
  disagree. Squash merge keeps the PR title as the commit on main, so never edit it in the merge dialog.
- Layout, develop commands and how to rebuild the CVs: `README.md`.
- The chat Worker's secrets (`ANTHROPIC_API_KEY`, `TURNSTILE_SECRET_KEY`) are never committed: they live only as
  Worker secrets (`wrangler secret put`) and in a local, git-ignored `worker/.dev.vars`.
- **Islands** (`src/islands/`, React): server-render the content, islands only toggle state; never render content
  only in React. Hydrate with `client:idle` unless a reason is written next to the directive.

## fable-code checks in this repo (JS equivalents)

- **Before-commit gate:** `npm run check` (eslint, prettier --check, astro check, scripts/check_layout.mjs, and the
  worker unit tests via `npm run worker:test`). It must pass clean; `npm run build` must pass before a push.
  `worker/` secrets live only in Worker secrets and a local, git-ignored `worker/.dev.vars`.
- **CI-only gates:** `npm run test:e2e` (Playwright smoke of the built site) and the Lighthouse budget run in CI
  on every pull request, not in the pre-commit hook (too slow). Run `npm run build && npm run test:e2e` before
  a push that changes pages.
- **Hooks:** `npm install` activates `.githooks/` (pre-commit runs `npm run check`, pre-push runs
  `npm run build`). Never commit with `--no-verify` / `-n` and never `git push --force`; the Claude Code hook in
  `.claude/settings.json` (`scripts/guard_git.mjs`) blocks both. A `PostToolUse` hook (`scripts/check_file.mjs`) checks every edited file in `src/`, `scripts/`,
  `worker/`, `tests/`, `.github/` and `.claude/skills/project-demo/` (eslint, prettier, size caps, no silencing)
  and feeds problems back as `fable-code:` lines: fix them before the next edit.
- **Layout caps** (`npm run check:layout`, eslint `max-lines`): no source file (`.astro .ts .tsx .js .mjs .css`) over
  400 lines (aim under 300); at most 8 loose source files per folder under `src/`, `scripts/`, `.github/`
  (`index.ts` does not count): add a subfolder such as `src/components/sections/` instead; no
  `utils` / `helpers` / `misc` / `common` file names.
- **Complexity caps** (eslint): complexity 10, max-params 5, max-depth 4, max-statements 50, max-len 120.
  Meet them by extracting a function or component.
- **No silencing:** no `eslint-disable`, `@ts-ignore`, `@ts-expect-error`, `prettier-ignore`, and no loosening of
  `eslint.config.js`, `.prettierrc.mjs`, `tsconfig.json` or `.prettierignore` to make a check pass.
- **Cycles:** `import-x/no-cycle` is an error; move shared code into its own module instead.
- **Docs move with code:** a new or moved file updates the `README.md` layout (and `scripts/README.md` for
  scripts) in the same commit.
