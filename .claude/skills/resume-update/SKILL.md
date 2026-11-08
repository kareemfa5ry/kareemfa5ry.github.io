---
name: resume-update
description: Update Kareem's resume, CV or site content from one edit. Use whenever anyone says they want to update, polish, correct or add to the resume, CV, experience, a role, a project, a bullet, skills, education, languages, contact details, the summary, the PDFs or what the chatbot knows, even if they never say "skill". Covers which file holds each fact, which of the five outputs it reaches (pages, /llms.txt, /resume.json, the chatbot, both PDF CVs), how `cv:` limits a bullet to one PDF, the one-time setup (cv/phone.txt, LaTeX) and the run order.
---

# resume-update

One fact lives in one file. Everything else is an output built from it.

**Source (edit these):** the content collections in `src/content/` (`experience`, `projects`, `skills`; schemas in
`src/content.config.ts`, fields in `src/content/README.md`) and the data modules in `src/site/`.

**Outputs (never edit by hand):**

1. the pages (`/`, `/projects/<slug>/`)
2. `/llms.txt` (`src/pages/llms.txt.ts`)
3. `/resume.json` (`src/pages/resume.json.ts`)
4. the chatbot: it reads only `/llms.txt`, cached for one hour (`worker/src/knowledge.ts`)
5. both PDF CVs: `cv/*.tex` (generated) and `public/assets/cv/*.pdf` (built from the .tex)

Never touch generated `.tex`, PDFs or `dist/`. Fix the source and rebuild.

## Where each fact lives

Legend: **auto** = reaches it on `npm run build`; **gen** = also needs `npm run cv:generate`; **pdf** = also needs
`npm run cv:pdf`; **bot** = reaches the chatbot through `/llms.txt`, up to an hour after the deploy.

| Fact                                                  | Edit                                                                                                  | Pages            | llms.txt and bot | resume.json                | PDFs                                        |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------- | ---------------- | -------------------------- | ------------------------------------------- |
| Name, email, LinkedIn, location                       | `src/site/contact.ts` (`FULL_NAME`, `EMAIL`, `LINKEDIN_*`, `LOCATION`)                                | auto             | auto, bot        | name, email, LinkedIn auto | gen + pdf (name: see next row)              |
| Legal name in the CV header                           | `src/site/contact.ts` (`LEGAL_NAME`)                                                                  | not shown        | not shown        | not shown                  | gen + pdf                                   |
| Tagline                                               | `src/site/profile.ts` (`TAGLINE`)                                                                     | auto             | auto, bot        | auto (`label`)             | not used                                    |
| Summary                                               | `src/site/profile.ts` (`PROFILE_SUMMARY`)                                                             | auto             | auto, bot        | auto                       | gen + pdf, the CVs without an override      |
| Availability                                          | `src/site/profile.ts` (`AVAILABILITY`)                                                                | auto (hero)      | auto, bot        | not shown                  | not used                                    |
| Stat tiles                                            | `src/site/profile.ts` (`STATS`)                                                                       | auto             | not shown        | not shown                  | not shown                                   |
| CV headline (header line 2)                           | `src/site/cv_files.ts` (`headline`)                                                                   | not shown        | not shown        | not shown                  | gen + pdf                                   |
| CV summary override                                   | `src/site/cv_files.ts` (`summary`; set for `rpm` today, so its PDF ignores `PROFILE_SUMMARY`)         | not shown        | not shown        | not shown                  | gen + pdf, that CV only                     |
| A role and its dates                                  | `src/content/experience/<id>.md` (`title`, `org`, `location`, `start`, `end`, `note`, `order`)        | auto             | auto, bot        | auto                       | gen + pdf                                   |
| A role bullet                                         | same file, `bullets:`                                                                                 | auto             | auto, bot        | auto                       | gen + pdf, unless `cv:` limits it           |
| A project and its bullets                             | `src/content/projects/<id>.md` (`title`, `org`, `period`, `summary`, `bullets`, `metrics`, `results`) | auto             | auto, bot        | auto                       | gen + pdf: title, org, period, bullets only |
| Project stack                                         | same file, `stack:`                                                                                   | auto (chips)     | not shown        | auto (`keywords`)          | gen + pdf, joined with commas               |
| A skills group                                        | `src/content/skills/<id>.md` (`label`, `order`, `items`)                                              | auto             | auto, bot        | auto                       | gen + pdf, only if listed in `cv_files.ts`  |
| Education lines                                       | `src/site/education.ts` (`EDUCATION`)                                                                 | auto             | auto, bot        | not shown                  | gen + pdf                                   |
| Languages                                             | `src/site/education.ts` (`LANGUAGES`)                                                                 | auto             | auto, bot        | not shown                  | gen + pdf                                   |
| Which projects and skills a CV shows, and their order | `src/site/cv_files.ts` (`projects`, `skills` id lists per CV)                                         | no change        | no change        | no change                  | gen + pdf                                   |
| CV card title, blurb, PDF path                        | `src/site/cv_files.ts` (`title`, `blurb`, `href`)                                                     | auto (Downloads) | auto, bot        | not shown                  | `href` basename names the .tex and the PDF  |
| Phone number                                          | `cv/phone.txt` (git-ignored)                                                                          | never            | never            | never                      | pdf only                                    |

Notes on the table. The city in `resume.json` is typed in `resume.json.ts`, not read from `LOCATION`. Industry
knowledge for the bot only (`src/site/knowledge/domain.ts`, `glossary.ts`) goes into `/llms.txt` and nowhere else.
Roles, and on the site projects and skill groups, follow their `order` field. In a PDF, roles follow `order` but
projects and skills follow the id lists in `cv_files.ts`.

## How `cv:` works on a bullet

A bullet in `bullets:` is a plain string or `{ text, cv: [...] }` (`bulletsFor` in `src/site/bullets.ts`).

- Untagged string: shown everywhere (site, llms.txt, resume.json, both PDFs).
- `cv: [sda]` or `cv: [rpm]`: shown in that PDF only. Both ids is the same as untagged.
- The site, llms.txt and resume.json always show every bullet.
- Allowed ids: `sda`, `rpm`; a typo fails the build.
- `cv: []`: site, llms.txt and resume.json only, no PDF.

Bullet order inside an entry is file order, for every CV.

`cv_files.ts` holds, per CV: `projects` (ordered ids = file names in `src/content/projects/`) and `skills` (ordered
ids = file names in `src/content/skills/`). To add a project or skill group to a PDF, create its file and add its
id to that list. The generator throws on an unknown project id and warns and skips an unknown skill id.

## One-time setup per machine

1. `npm install` (also activates the hooks).
2. `cv/phone.txt`: one line with the phone number. It is git-ignored, and the PDF build hands it to LaTeX as an
   argument. Without the file the build warns loudly and prints the PDFs without a phone. Never write the number
   in any tracked file, commit message or PR text.
3. A LaTeX distribution with `pdflatex` on PATH: MiKTeX or TeX Live. macOS: `/Library/TeX/texbin` (the build finds it even when it is not on PATH). Windows:
   install MiKTeX, allow it to install missing packages on the fly, then open a new terminal so PATH updates. The
   build runs `pdflatex` without a shell, so PowerShell and zsh behave the same.
4. Windows: `.gitattributes` keeps `cv/**` as LF, so autocrlf does not make the .tex look stale.

## Run order

1. Edit the source (table above). Facts only.
2. `npm run cv:generate` rewrites `cv/*.tex` from the content. A second run gives no git diff.
3. `npm run cv:pdf` builds both PDFs with `pdflatex` (two passes each), copies them to `public/assets/cv/` and
   updates `cv/built-from.json` (the sha256 of each .tex).
4. `npm run check` (lint, format, types, layout, tests and `cv:generate --check`). The CV step prints one line per
   problem and fails:
   - `cv: <file>.tex stale, run npm run cv:generate`: the content changed and the .tex was not regenerated.
   - `cv: <file>.pdf not rebuilt, run npm run cv:pdf`: the .tex is current, but its hash in `cv/built-from.json`
     differs, so the PDF was not rebuilt from it.
5. `npm run build`, then look at the changed page.
6. Open a pull request per the AGENTS.md naming rule: one feature each, branch `feature/NN-short-name`, title
   `NN: <feature>`, NN the number GitHub gives the PR. Commit the content, the .tex, the PDFs and
   `cv/built-from.json` together.
7. After the merge the site deploys, and the chatbot picks the change up within an hour (the `/llms.txt` cache).

## Checklist for the agent doing the update

- Facts only: dates, numbers, tools and outcomes the owner gave you. Never invent or round a figure.
- One wording per fact, written once in the content. If a CV needs different detail, use a `cv:` bullet or a
  `cv_files.ts` override, not a second sentence.
- Keep `/llms.txt` under the chatbot cap, 65536 bytes (`MAX_KNOWLEDGE_BYTES`; the fetch fails at or above it).
  After a big addition run `npm run build` and `wc -c dist/llms.txt`.
- Keep bullet counts per CV sensible. Current targets, roles in page order: Senior Data Analyst 2, 7, 6, 2 and
  Revenue and Pricing Manager 2, 9, 7, 3, unless the owner gives new numbers. Count with `bulletsFor(bullets,
cvId)` in a throwaway `node -e` and commit nothing. Check the PDF page count after adding a lot.
- Never copy private material from the private `knowledge-base` repo into content, and never put the phone number
  in any text file.
- A field you add moves its docs with it (`src/content/README.md`, README).

## Do not

- Edit `cv/*.tex` except `cv/preamble.tex` (the hand-written macros and packages).
- Commit PDFs without the matching `cv/built-from.json`.
- Keep a second copy of a sentence between the site and a CV.
- Edit `dist/`, a PDF or a generated file by hand, or bypass hooks with `--no-verify`.
