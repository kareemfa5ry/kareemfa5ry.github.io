# tests

Unit tests of pure modules (`tests/unit/`, Node's built-in runner, part of `npm run check`) and end-to-end smoke tests of the built site, run by Playwright (Chromium) against `npm run preview`. Build first:
`npm run build && npm run test:e2e`. CI runs them on every pull request; they are not in the pre-commit hook.
First run on a machine: `npx playwright install chromium`.

One spec file per concern. Each file under `tests/e2e` and `tests/unit` starts with a one-line comment saying what it
covers; list them with:

```sh
head -1 tests/e2e/*.spec.ts tests/unit/*.test.mjs
```
