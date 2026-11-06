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
src/components/projects/    project-page parts: ScreenshotGallery, StackTags
src/components/theme/       light/dark theme: ThemeInit (inline head script, applies the stored choice before
                            paint) and ThemeToggle (nav airplane switch that changes and remembers the choice)
src/islands/                React islands (ProjectFilter: filter chips; ChatWidget: floating chat launcher + dock frame; ChatPanel + useChatStream: the chat); rule:
                            server-render the content, islands only toggle state; never render content only in React
src/site/chat.ts            Worker URL and Turnstile site key for the chat panel (empty = no chat widget)
src/site/contact.ts         name, email, LinkedIn and location used by several components
src/site/profile.ts         tagline, profile paragraph and the four stat tiles
src/site/education.ts       education, training and languages lines (home page, llms.txt)
src/site/cv_files.ts        titles, descriptions and paths of the published CV PDFs (Downloads, llms.txt)
src/site/person_jsonld.ts   schema.org Person record (JSON-LD) for the home page head
src/site/plain_bullets.ts   plain-text bullets from an entry's Markdown body, for llms.txt and resume.json
src/site/theme.ts           theme names, the localStorage key and the <html> attribute the theme switch uses
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
scripts/                    Node checks and the Claude Code git guard (see scripts/README.md)
worker/                     chat endpoint ("ask about Kareem"), a Cloudflare Worker: src/, test/, wrangler.jsonc
                            (see worker/README.md); the layout check and eslint cover it too
.githooks/                  pre-commit (npm run check) and pre-push (npm run build)
.github/workflows/          ci.yml (check, e2e and lighthouse jobs on PRs and branches), deploy.yml (Pages deploy from main)
.github/rulesets/           protect-main.json: branch ruleset to import once (see Publishing)
eslint.config.js            lint rules, including the fable-code size and complexity caps
.prettierrc.mjs             formatting (printWidth 120, Astro plugin)
AGENTS.md, CLAUDE.md        rules for AI coding agents (Copilot, Claude Code, Codex)
.claude/                    agent skills (fable-code) and the Claude Code hook settings; .claude/worktrees/ is harness output, git- and prettier-ignored
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

Run `npx prettier --write .` to fix formatting reported by `npm run check`.

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

The LaTeX and Word sources and the build script live in the private `knowledge-base` repository, cloned next to
this one. Its `build.ps1` writes the PDFs into `public/assets/cv/` here.

## Updating a CV

1. Edit and build the CV in the private repository; the PDFs land in `public/assets/cv/`.
2. If the change affects the website text, update the matching Markdown file in `src/content/`.
3. Commit on a branch (the pre-commit hook runs `npm run check`) and open a pull request; merging publishes `main`.

## What never goes in this repository

It is public. No secrets or API keys, no CV sources, no screenshots with real company figures or names, no raw
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
