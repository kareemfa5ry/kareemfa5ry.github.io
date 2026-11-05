# scripts

Node scripts (no dependencies), run from the repo root on Windows and macOS.

| Script             | What it does                                                                                                                                                                                                                                  | Run by                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `check_layout.mjs` | Fails on a source file over 400 lines, a folder with more than 8 loose source files, a `utils`/`helpers`/`misc`/`common` file name, or a lint-silencing comment in `src/` or `scripts/`. Prints `path: reason` per violation, or `layout ok`. | `npm run check:layout` (part of `npm run check`) |
| `guard_git.mjs`    | Claude Code `PreToolUse` hook on Bash: blocks `git commit --no-verify` / `-n` and `git push --force` / `-f` with exit 2.                                                                                                                      | `.claude/settings.json`                          |
