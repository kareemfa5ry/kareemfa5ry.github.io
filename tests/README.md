# tests

Unit tests of pure modules (`tests/unit/`, Node's built-in runner, part of `npm run check`) and end-to-end smoke tests of the built site, run by Playwright (Chromium) against `npm run preview`. Build first:
`npm run build && npm run test:e2e`. CI runs them on every pull request; they are not in the pre-commit hook.
First run on a machine: `npx playwright install chromium`.

| Spec                           | What it checks                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------- |
| `e2e/home.spec.ts`             | title, nav links and sections, the four stat tiles, the five project links, no console errors      |
| `e2e/project_page.spec.ts`     | a project page renders its h1 and the back link; the Results chart SVG is drawn                    |
| `e2e/machine_readable.spec.ts` | `/llms.txt`, `/resume.json` (4 work entries), both CV PDFs, `/og.png` is 1200x630                  |
| `e2e/filter_island.spec.ts`    | a skill chip hides projects, a second click restores them, Enter toggles                           |
| `e2e/theme.spec.ts`            | page follows the system theme; the nav switch changes theme, keeps it, works from the keyboard     |
| `e2e/chat_turnstile.spec.ts`   | a failed human check is retried once (widget removed); a persistent one shows the human-check text |
| `unit/chat_history.test.mjs`   | `trimHistory` (src/islands/chat_history.ts): limits, pair dropping, ends with the user turn        |
| `unit/check_pr_name.test.mjs`  | scripts/check_pr_name.mjs exit codes: number, title and branch agree; branch-only mode             |
