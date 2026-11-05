# Site content

The CV text lives here as Markdown files, one file per entry. The front matter (between the two `---` lines) is
checked against the schema in `src/content.config.ts` on every build: a missing required field, a misspelt key or
a wrong type stops the build and names the file and the field. The body under the front matter is the bullet list.

Each folder has one finished example. Copy it, rename it and change the text.

| Folder        | Example                                  | Id (used by references) |
| ------------- | ---------------------------------------- | ----------------------- |
| `projects/`   | `projects/daily-revenue-pipeline.md`     | file name without `.md` |
| `experience/` | `experience/nesma-data-ai-consultant.md` | file name without `.md` |
| `skills/`     | `skills/sql-and-databases.md`            | file name without `.md` |

The tagline, profile paragraph and the four stat tiles are not here: they live in `src/site/profile.ts`.

Front matter tips: quote years and months (`period: "2026"`, `start: "2026-02"`), otherwise they are read as
numbers. Use lower-case file names with hyphens (`competitor-price-tracker.md`).

## projects

| Field         | Type                           | Required | Meaning                                                                |
| ------------- | ------------------------------ | -------- | ---------------------------------------------------------------------- |
| `title`       | text                           | yes      | Project name, shown as the heading.                                    |
| `org`         | text                           | yes      | Organisation the work was done for.                                    |
| `period`      | text, quoted                   | no       | When, shown as typed: `"2026"` or `"2023–2024"`; omit if no year.      |
| `order`       | whole number from 1            | yes      | Position in the Projects section, 1 first.                             |
| `summary`     | text, one sentence             | yes      | What it does and why it mattered; used on cards and as chat context.   |
| `stack`       | list of text                   | yes      | Technology tags, shown as chips in this order.                         |
| `skills`      | list of skill ids              | yes      | Skill groups this project proves, e.g. `[sql-and-databases]`.          |
| `metrics`     | list of `{value, label}`       | yes      | Headline numbers; `[]` when there are none.                            |
| `screenshots` | list of `{src, alt, caption?}` | yes      | Images; `[]` when there are none. See `src/assets/projects/README.md`. |
| body          | Markdown bullet list           | yes      | The project bullets.                                                   |

A screenshot entry: `src` is the path from the project file to the image
(`../../assets/projects/<slug>/01-dashboard.png`), `alt` describes the image and is mandatory, `caption` is optional.

## experience

| Field      | Type                           | Required | Meaning                                                         |
| ---------- | ------------------------------ | -------- | --------------------------------------------------------------- |
| `title`    | text                           | no       | Job title; omit when the roles are in the note (Air Arabia).    |
| `org`      | text                           | yes      | Employer or client.                                             |
| `location` | text                           | yes      | City or region.                                                 |
| `start`    | `"YYYY-MM"`, quoted            | yes      | First month in the role.                                        |
| `end`      | `"YYYY-MM"`, quoted, or `null` | yes      | Last month in the role; `null` while it is current ("Present"). |
| `note`     | text                           | no       | Context line shown above the bullets.                           |
| `order`    | whole number from 1            | yes      | Position in the Experience section, 1 first.                    |
| `projects` | list of project ids            | no       | Projects done in this role, e.g. `[daily-revenue-pipeline]`.    |
| body       | Markdown bullet list           | yes      | The job bullets.                                                |

## skills

One file per skill group.

| Field   | Type                | Required | Meaning                                  |
| ------- | ------------------- | -------- | ---------------------------------------- |
| `label` | text                | yes      | Group name, shown as the heading.        |
| `order` | whole number from 1 | yes      | Position in the Skills section, 1 first. |
| `items` | list of text        | yes      | Skills in the group, at least one.       |
| body    | Markdown            | no       | Not shown today; leave empty.            |

## How to add a project

1. Copy `projects/daily-revenue-pipeline.md` and name the copy after the project, e.g. `price-tracker.md`.
2. Replace every value in the front matter; keep each key, use `[]` for an empty list.
3. Replace the bullets under the second `---` with your own, one `- ` line each.
4. Screenshots: put them in `src/assets/projects/<file name>/` and list each one with its `alt` text.
5. Run `npm run build`; if it fails, the message names the file and field to fix.
