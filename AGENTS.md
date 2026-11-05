# Agent rules

- Every code change (Astro, CSS, scripts, workflows, LaTeX build, a one-line fix too) follows the `fable-code`
  skill in `.claude/skills/fable-code/SKILL.md`: its 10 rules while writing, its before-commit checks, its
  handoff block. A stricter rule here wins.
- Layout, develop commands and how to rebuild the CVs: `README.md`.
- **Islands** (`src/islands/`, React): server-render the content, islands only toggle state; never render content
  only in React. Hydrate with `client:idle` unless a reason is written next to the directive.

## fable-code checks in this repo (JS equivalents)

- **Before-commit gate:** `npm run check` (eslint, prettier --check, astro check, scripts/check_layout.mjs). It
  must pass clean; `npm run build` must pass before a push.
- **Hooks:** `npm install` activates `.githooks/` (pre-commit runs `npm run check`, pre-push runs
  `npm run build`). Never commit with `--no-verify` / `-n` and never `git push --force`; the Claude Code hook in
  `.claude/settings.json` (`scripts/guard_git.mjs`) blocks both.
- **Layout caps** (`npm run check:layout`, eslint `max-lines`): no source file (`.astro .ts .js .mjs .css`) over
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
