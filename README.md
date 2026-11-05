# Kareem Fakhry — CV website

Personal CV site, served with GitHub Pages from the repository root.

## Layout

```
index.html              the website (single page, no build step)
assets/cv/              published PDF CVs linked from the site
src/latex/              LaTeX sources for each CV version
src/docx/               Word versions of each CV
build.ps1               recompiles the LaTeX CVs and refreshes assets/cv/
.nojekyll               tells GitHub Pages to serve files as-is
AGENTS.md, CLAUDE.md    rules for AI coding agents (Copilot, Claude Code, Codex)
.claude/skills/         agent skills (fable-code), read by Claude Code and Copilot CLI
```

## CV versions

| Version | Source | PDF |
|---|---|---|
| Senior Data Analyst | `src/latex/Kareem_Fakhry_CV_Senior_Data_Analyst.tex` | `assets/cv/Kareem_Fakhry_CV_Senior_Data_Analyst.pdf` |
| Revenue and Pricing Manager | `src/latex/Kareem_Fakhry_CV_Revenue_Pricing_Manager.tex` | `assets/cv/Kareem_Fakhry_CV_Revenue_Pricing_Manager.pdf` |

## Updating a CV

1. Edit the `.tex` file in `src/latex/`.
2. Run `./build.ps1` (needs MiKTeX or TeX Live with `latexmk`).
3. If the change affects the website text, update `index.html` too.
4. Commit and push; GitHub Pages redeploys automatically.

## Preview locally

Open `index.html` in a browser, or run `python -m http.server` and visit http://localhost:8000.

## Publishing on GitHub Pages

Repository **Settings → Pages → Build and deployment**: Source *Deploy from a branch*, branch `main`, folder `/ (root)`.
