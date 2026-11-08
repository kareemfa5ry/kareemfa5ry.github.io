# Kareem Fakhry — CV website

Personal CV site built with [Astro](https://astro.build) (static output) and deployed to GitHub Pages by
GitHub Actions.

## Layout

```
src/pages/index.astro       the CV page: composes the sections from the content collections and profile.ts
src/pages/projects/[slug].astro  one detail page per project: metrics, bullets, stack, screenshots, skills proved
src/layouts/Base.astro      page shell: head, meta and OG tags, favicon, global stylesheet, nav, footer
src/components/             one component per concern: Nav, Hero, Stats, ExperienceEntry, ProjectEntry,
                            SkillsGrid, Downloads, Footer (each owns its scoped <style>)
src/components/charts/      BeforeAfterChart (server-rendered SVG dumbbell for a `results` list) and its scale.ts
src/components/projects/    project-page parts: ScreenshotGallery, StackTags, Demo (iframe of a generated demo), demos.ts (hasDemo)
src/components/theme/       light/dark theme: ThemeToggle (nav airplane switch; calls toggleTheme from public/theme.js)
src/islands/                React islands (ProjectFilter: filter chips; ChatWidget: floating chat launcher + dock frame; ChatPanel + chat/: the chat); rule:
                            server-render the content, islands only toggle state; never render content only in React
src/site/chat.ts            Worker URL, Turnstile site key and starter chips for the chat panel (empty = no chat widget)
src/site/contact.ts         name, email, LinkedIn and location used by several components
src/site/profile.ts         tagline, profile paragraph and the four stat tiles
src/site/education.ts       education and training lines plus the languages line (home page, llms.txt, CV .tex)
src/site/knowledge/       domain.ts (industry facts) and glossary.ts (terms) for llms.txt
src/site/cv_files.ts        the two CVs: titles, paths, headlines, ordered project and skill ids (Downloads, llms.txt, .tex)
src/site/month.ts           monthLabel: "2026-02" -> "Feb 2026" (experience dates, CV .tex)
src/site/person_jsonld.ts   schema.org Person record (JSON-LD) for the home page head
src/site/bullets.ts         the front matter bullets of an entry, shared by the pages, llms.txt and resume.json
public/theme.css            the palette tokens and color-scheme; linked by the site and the demos
public/theme.js             theme storage key, readTheme/applyTheme/toggleTheme, cross-document storage sync
src/pages/llms.txt.ts       /llms.txt endpoint: the CV as Markdown for AI assistants, generated from the content
src/pages/resume.json.ts    /resume.json endpoint: JSON Resume v1, generated from the content
src/content.config.ts       content collection schemas (projects, experience, skills); strict, every field described
src/content/                one Markdown file per project, job and skill group (fields: src/content/README.md)
src/assets/projects/        project screenshots, one folder per project (see its README.md)
src/styles/global.css       tokens, dark mode, base elements, shared classes, print rules
public/og.png               social preview image (1200x630), linked from the head in Base.astro
public/assets/cv/           published PDF CVs, served at /assets/cv/<name>.pdf
tests/e2e/                  Playwright smoke specs of the built site (see tests/README.md)
playwright.config.ts        Playwright config: Chromium, serves dist/ with `npm run preview` on port 4321
lighthouserc.json           Lighthouse CI budget: category minimums for / and a project page
scripts/                    Node checks and the Claude Code hooks (see scripts/README.md)
scripts/cv/                 generate.mjs and latex.mjs: content -> cv/*.tex (`npm run cv:generate`; `--check` runs in `npm run check`)
cv/                         preamble.tex (hand-written) and the two generated CV .tex files; built-from.json holds their hashes
cv/phone.txt, cv/out/       ignored by version control: the phone number (one line) and pdflatex output
worker/                     chat endpoint ("ask about Kareem"), a Cloudflare Worker: src/, test/, wrangler.jsonc
                            (see worker/README.md); the layout check and eslint cover it too
.githooks/                  pre-commit (npm run check) and pre-push (npm run build)
.github/workflows/          ci.yml (check, e2e and lighthouse jobs on PRs and branches), deploy.yml (Pages deploy from main)
.github/rulesets/           protect-main.json: branch ruleset to import once (see Publishing)
eslint.config.js            lint rules, including the fable-code size and complexity caps
.prettierrc.mjs             formatting (printWidth 120, Astro plugin)
AGENTS.md, CLAUDE.md        rules for AI coding agents (Copilot, Claude Code, Codex)
.claude/                    agent skills (fable-code, ponytail, project-demo, dummy-screenshots) and the Claude Code hook settings; .claude/worktrees/ is harness output, git- and prettier-ignored
```

## Develop

Needs Node 22.23.4 or newer (Astro 7's minimum) and npm, on Windows or macOS.

```
npm install        # installs tools and activates the git hooks in .githooks/
npm run dev        # local server at http://localhost:4321
npm run check      # lint, format check, astro check, layout check, worker tests: the before-commit gate
npm run build      # static site in dist/
npm run preview    # serve dist/ locally
npm run test:e2e   # Playwright smoke tests of dist/ (build first; `npx playwright install chromium` once)
```

Run `npx prettier --write .` to fix formatting reported by `npm run check`. The Claude Code `PostToolUse` hook
`scripts/check_file.mjs` runs the same checks on each file an agent edits and feeds problems back at once.

## Quality gates

On every pull request CI runs three jobs: `check` (the pre-commit gate), `e2e` (`npm run build` then
`npm run test:e2e`, Playwright against the built site) and `lighthouse` (Lighthouse CI on `/` and a project
page, failing under performance 0.9, accessibility 0.95, best-practices 0.9 or SEO 0.9; see
`lighthouserc.json`). A failed e2e run uploads its Playwright report as an artifact.

## Chat endpoint

`worker/` is the "ask about Kareem" chat endpoint: a Cloudflare Worker that answers from `/llms.txt` with Claude and
streams the reply. Contract, secrets, local run and deploy: `worker/README.md`.

### Turning the chat on or off

The chat is on: `src/site/chat.ts` holds the deployed Worker URL and the Turnstile site key (both public values).
To take the chat off the site, empty either value; the home page then has no chat section and no nav link.
After redeploying the Worker under a new name or account, update `workerUrl` there.

## Regenerating the preview image

`public/og.png` is a screenshot of a 1200x630 HTML mock of the hero and stats (light theme tokens, system-ui).
Regenerate it when the tagline or the stats in `src/site/profile.ts` change.

## CV PDFs

| Version                     | PDF                                                             |
| --------------------------- | --------------------------------------------------------------- |
| Senior Data Analyst         | `public/assets/cv/Kareem_Fakhry_CV_Senior_Data_Analyst.pdf`     |
| Revenue and Pricing Manager | `public/assets/cv/Kareem_Fakhry_CV_Revenue_Pricing_Manager.pdf` |

Both PDFs are built from the generated LaTeX in `cv/` (see Layout); the content lives in `src/content/` and
`src/site/`, and the CV header, style and layout in `cv/preamble.tex`.

Needs `pdflatex` on PATH (MacTeX or BasicTeX on macOS, MiKTeX or TeX Live on Windows). The phone number is not
in the repository: put it on one line in the ignored `cv/phone.txt`. Without that file the build warns
loudly and leaves the phone out, so do not publish those PDFs.

## Updating a CV

1. Edit the content in `src/content/` or `src/site/` (the website and both CVs read the same files).
2. `npm run cv:generate` rewrites `cv/*.tex`.
3. `npm run cv:pdf` builds both PDFs into `public/assets/cv/` and updates `cv/built-from.json`.
4. Commit on a branch (the pre-commit hook runs `npm run check`, which fails when a PDF is out of date) and open a
   pull request; merging publishes `main`.

## What never goes in this repository

It is public. No secrets or API keys, no phone number, no screenshots with real company figures or names, no raw
company data. Private material belongs in the `knowledge-base` repository.

## Publishing on GitHub Pages

`.github/workflows/deploy.yml` builds with `withastro/action` and publishes with `actions/deploy-pages` on every
push to `main`. **One-time human step:** in repository **Settings → Pages → Build and deployment**, switch
Source from _Deploy from a branch_ to _GitHub Actions_. Until then the old branch deploy keeps serving.

GitHub Pages on the free plan only serves **public** repositories, so the repository must be public (or the
owner on GitHub Pro) before the first deploy.

## Protecting `main`

Every change reaches `main` through a pull request that passes the `check` job in `ci.yml`. The owner imports
the ruleset once: **Settings → Rules → Rulesets → New ruleset → Import a ruleset**, choose
`.github/rulesets/protect-main.json`. It requires a pull request (squash merge), the `check` and `e2e` statuses (`lighthouse` stays advisory), and blocks
force pushes and deletion of `main`.
After a change to the ruleset file, the owner must re-import it for the new check (`e2e`) to become required.

### Stuck GitHub Pages deployment

Symptom: every deploy run fails with "in progress deployment, cancel `<sha>` first". GitHub's side can take up to 30 minutes to clear.

1. Cancel it: `gh api -X POST repos/kareemfa5ry/kareemfa5ry.github.io/pages/deployments/<sha>/cancel`.
2. List deployments: `gh api repos/kareemfa5ry/kareemfa5ry.github.io/deployments?environment=github-pages`.
3. Mark the stuck one inactive (POST a status with state `inactive` to its `statuses_url`) and DELETE it.
4. Wait a few minutes, then re-run the failed deploy: `gh run rerun <id>`.
