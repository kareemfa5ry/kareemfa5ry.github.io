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
src/components/projects/    project-page parts: ScreenshotGallery, StackTags
src/site/contact.ts         name, email, LinkedIn and location used by several components
src/site/profile.ts         tagline, profile paragraph and the four stat tiles
src/content.config.ts       content collection schemas (projects, experience, skills); strict, every field described
src/content/                one Markdown file per project, job and skill group (fields: src/content/README.md)
src/assets/projects/        project screenshots, one folder per project (see its README.md)
src/styles/global.css       tokens, dark mode, base elements, shared classes, print rules
public/assets/cv/           published PDF CVs, served at /assets/cv/<name>.pdf
src/latex/                  LaTeX sources for each CV version
src/docx/                   Word versions of each CV
build.ps1                   recompiles the LaTeX CVs and refreshes public/assets/cv/
scripts/                    Node checks and the Claude Code git guard (see scripts/README.md)
.githooks/                  pre-commit (npm run check) and pre-push (npm run build)
.github/workflows/          ci.yml (checks on PRs and branches), deploy.yml (Pages deploy from main)
eslint.config.js            lint rules, including the fable-code size and complexity caps
.prettierrc.mjs             formatting (printWidth 120, Astro plugin)
AGENTS.md, CLAUDE.md        rules for AI coding agents (Copilot, Claude Code, Codex)
.claude/                    agent skills (fable-code) and the Claude Code hook settings
```

## Develop

Needs Node 22.23.4 or newer (Astro 7's minimum) and npm, on Windows or macOS.

```
npm install        # installs tools and activates the git hooks in .githooks/
npm run dev        # local server at http://localhost:4321
npm run check      # lint, format check, astro check, layout check: the before-commit gate
npm run build      # static site in dist/
npm run preview    # serve dist/ locally
```

Run `npx prettier --write .` to fix formatting reported by `npm run check`.

## CV versions

| Version                     | Source                                                   | PDF                                                             |
| --------------------------- | -------------------------------------------------------- | --------------------------------------------------------------- |
| Senior Data Analyst         | `src/latex/Kareem_Fakhry_CV_Senior_Data_Analyst.tex`     | `public/assets/cv/Kareem_Fakhry_CV_Senior_Data_Analyst.pdf`     |
| Revenue and Pricing Manager | `src/latex/Kareem_Fakhry_CV_Revenue_Pricing_Manager.tex` | `public/assets/cv/Kareem_Fakhry_CV_Revenue_Pricing_Manager.pdf` |

## Updating a CV

1. Edit the `.tex` file in `src/latex/`.
2. Run `./build.ps1` (needs MiKTeX or TeX Live with `pdflatex`).
3. If the change affects the website text, update the matching Markdown file in `src/content/`.
4. Commit (the pre-commit hook runs `npm run check`) and push; the deploy workflow publishes `main`.

## Publishing on GitHub Pages

`.github/workflows/deploy.yml` builds with `withastro/action` and publishes with `actions/deploy-pages` on every
push to `main`. **One-time human step:** in repository **Settings → Pages → Build and deployment**, switch
Source from _Deploy from a branch_ to _GitHub Actions_. Until then the old branch deploy keeps serving.
