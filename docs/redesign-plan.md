# Redesign plan: Kareem Fakhry's portfolio, better looking and more interactive

Goal: match or beat https://arpanpathak.github.io/ for recruiters, using its techniques (persona hero, numbers
everywhere, flagship work told as pipelines, motion on scroll, a clear open-to-work call) and none of its
developer persona. Kareem's persona is an analyst's dashboard: KPI tiles, charts that draw themselves, real
dashboards, live demos and an assistant that answers from his record.

Read from the repo on branch `feature/75-screenshot-projects-first` (not `main`; the three screenshot projects
already carry `order` 1 to 3 there). Nothing was built or run. File and line references are to that branch.

## 0. Rules every item follows

- One feature per PR, branch `feature/NN-short-name`, title `NN: <feature>` (AGENTS.md). NN below is a placeholder.
- `fable-code` rules and handoff block on every change; `npm run check` before commit, `npm run build &&
npm run test:e2e` before push; README layout updated in the same commit when a file is added.
- **No new dependency in any item.** Everything is CSS, native HTML (`<dialog>`, `popover`, `<details>`), server-
  rendered SVG, or a short `<script>` inside an `.astro` component (precedent: `src/components/theme/ThemeToggle.astro:41-56`).
- **No new React island.** Only two existing islands are touched (item 4.2). All new content is server-rendered,
  so the islands rule (content never rendered only in React) holds by construction.
- Colours only from `public/theme.css:6-15` tokens; images that differ by theme use `.only-light` / `.only-dark`
  (`public/theme.css:23-38`).
- Motion only inside `@media (prefers-reduced-motion: no-preference)`; content is visible by default and motion is
  added on top, so no JS, no CSS support or motion off all show the full page (the reference fails both).
- Folder caps that shape the file list (`scripts/check_layout.mjs:18`, 8 loose files):
  | Folder                     | Loose now | Consequence                                                                                                                                                                                                                                                                   |
  | -------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `src/components/`          | 8 (full)  | new components go in subfolders: `sections/`, `metrics/`, `glossary/`, existing `projects/`, `charts/`                                                                                                                                                                        |
  | `src/site/`                | 8 (full)  | no new loose module; extend `profile.ts` or add under `src/site/knowledge/` (2 loose)                                                                                                                                                                                         |
  | `src/components/projects/` | 4         | room for 3 more (items 2.2, 2.3, 2.5)                                                                                                                                                                                                                                         |
  | `src/islands/`             | 6         | no new files planned                                                                                                                                                                                                                                                          |
  | `tests/e2e/`               | 7         | one new loose spec (`motion.spec.ts`, item 0.2); everything else extends an existing spec. If `home.spec.ts` (105 lines) nears 300, split it into `tests/e2e/home/hero.spec.ts` and `tests/e2e/home/projects.spec.ts` (Playwright reads subfolders, `playwright.config.ts:8`) |
  | `tests/unit/`              | 6         | room for 2 (items 2.6, 3.4)                                                                                                                                                                                                                                                   |

## 1. Gap table

| #   | Reference feature                                | Kareem's site today                                                                                                                                                                  | Verdict                                                                                                                                                                                                   |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Sticky nav with resume button                    | Sticky blurred nav, 4 links, "Download CV" as a plain link, theme switch (`src/components/Nav.astro:6-11,27-34`)                                                                     | **Adapt**: mark the section in view and style the CV link as a button (item 4.3). No burger: 4 links scroll sideways without JS (`Nav.astro:35-41`)                                                       |
| 2   | Nav restyles after 20px scroll                   | Nav is already translucent with blur and a rule (`Nav.astro:31-33`)                                                                                                                  | **Skip**: no visible gain                                                                                                                                                                                 |
| 3   | Terminal hero with typing effect                 | Plain text hero: name, tagline, 3 proof numbers, 2 CV buttons, chat button, contact, availability (`src/components/Hero.astro:14-43`)                                                | **Adapt**: the persona becomes a KPI panel (tiles plus a results chart that draws itself), not a terminal (items 1.1, 1.2). Typing effect skipped: developer persona, and typed text hurts screen readers |
| 4   | Tech chips in the hero                           | None in the hero; stack chips on projects (`src/components/projects/StackTags.astro`)                                                                                                | **Adapt**: an employers line ("Nesma Airlines, Nile Air, Air Arabia") from the experience collection answers a recruiter's first question better than tool chips (item 1.1)                               |
| 5   | Three CTAs                                       | Two CV downloads plus "Ask about Kareem" (`Hero.astro:24-34`)                                                                                                                        | **Already better**: a CV per role and a live assistant                                                                                                                                                    |
| 6   | Badge row: location, open to work                | Three availability sentences in small muted text (`Hero.astro:42`, `src/site/profile.ts:28-32`)                                                                                      | **Adopt**: status badges with a live dot (item 1.1)                                                                                                                                                       |
| 7   | Numbered sections 01 to 10                       | Small uppercase `h2` labels (`src/styles/global.css:104-110`)                                                                                                                        | **Adapt**: CSS counters on `h2`, no markup (item 0.1)                                                                                                                                                     |
| 8   | Six count-up stat counters                       | Hero proof numbers and project-page tiles are static (`Hero.astro:17-23`, `src/components/Stats.astro`)                                                                              | **Adapt**: count up only numbers that scroll into view (card and role chips, item 2.6); above-the-fold numbers get a CSS entrance instead, because a script count-up there flashes final, zero, final     |
| 9   | Flagship deep-dives with logo and pipeline cards | Each project has a pipeline only inside its demo (`public/demos/*/spec.json`, `pipeline` shot); home lists every bullet of every project (`src/components/ProjectEntry.astro:48-52`) | **Adopt**: pipeline strip rendered on the page from the same spec (item 2.2); featured rows with a real screenshot (item 2.3). Logos skipped (no assets)                                                  |
| 10  | Project grid with pills and NEW badge            | A vertical list, one poster each, bullets, stack chips (`ProjectEntry.astro:18-54`)                                                                                                  | **Adopt**: card grid with summary, numbers, demo badge (item 2.1). NEW badge skipped (nothing dated)                                                                                                      |
| 11  | Experience with bold metrics and tags            | Plain bullets, a before/after chart on one role (`src/components/ExperienceEntry.astro:18-30`)                                                                                       | **Adapt and beat**: timeline rail (item 3.1), headline numbers per role (item 3.2), links to the projects built in the role (item 3.3)                                                                    |
| 12  | Skills tag groups                                | Comma-joined text in two columns, each group linked to the projects that prove it (`src/components/SkillsGrid.astro:20-31`)                                                          | **Adapt**: chips (item 3.5); the "Proven by" links are **already better** than the reference                                                                                                              |
| 13  | Books and paper (depth signals)                  | A 25-fact domain list and a glossary exist but reach only `/llms.txt` (`src/site/knowledge/domain.ts`, `glossary.ts`; `src/pages/llms.txt.ts:76`)                                    | **Adapt**: airline terms explained on tap wherever they appear (item 3.4)                                                                                                                                 |
| 14  | Education                                        | One list of 4 lines (`src/pages/index.astro:71-78`)                                                                                                                                  | **Skip** as an item; it inherits the new base styles (item 0.1)                                                                                                                                           |
| 15  | Contact section with closing line                | CV cards, then a one-line footer (`src/components/Downloads.astro`, `Footer.astro:8`)                                                                                                | **Adopt**: closing contact section (item 4.1)                                                                                                                                                             |
| 16  | Scroll reveal                                    | None                                                                                                                                                                                 | **Adopt, CSS only** (item 0.2)                                                                                                                                                                            |
| 17  | Mobile burger                                    | Links scroll sideways, switch stays pinned                                                                                                                                           | **Skip**: works without JS; check at 360px in item 4.3                                                                                                                                                    |
| 18  | No reduced-motion guard (weakness)               | Guards exist for the switch and the chat; `scroll-behavior: smooth` is unguarded (`global.css:11-13`)                                                                                | **Fix** in item 0.2                                                                                                                                                                                       |
| 19  | Blank sections without JS (weakness)             | Everything server-rendered; filter chips hide without JS (`src/islands/ProjectFilter.tsx:53`)                                                                                        | **Already better**; keep it true                                                                                                                                                                          |
| 20  | No theme toggle, no filters, no modals           | Theme switch, skill filter, chat assistant, six playable demos, CV per role, `/llms.txt`, `/resume.json`                                                                             | **Already better**; make them visible earlier (items 2.5, 4.2)                                                                                                                                            |

## 2. Phases and work items

Sizes: S = under about 80 changed lines, M = 80 to 250, L = more or cross-cutting.

### Phase 0: foundation

#### 0.1 `NN: Refreshed look: type scale, cards and numbered section headings`

- **Outcome**: larger section headings with a "01" style number, consistent card surface, spacing and focus ring,
  a wider container for grids. The page stops reading as a plain document.
- **Files**: `src/styles/global.css` (162 lines; add tokens `--space-*`, `--radius`, `--shadow`, `--maxw-wide`,
  `.card`, `.chip`, `h2` counter, `font-variant-numeric: tabular-nums` on
  numbers). Replace the three copies of the card look with `.card`: `src/components/Stats.astro:28-33`,
  `Downloads.astro:27-32`, `charts/BeforeAfterChart.astro:55-61`.
- **Reuses**: existing tokens; system font stack stays (a web font would cost Lighthouse points for no recruiter gain).
- **JS**: none. **No JS / reduced motion**: nothing moves.
- **A11y**: counter text silenced with `content: counter(...) / ""`; headings keep their text; every text pair stays
  on the existing AA tokens; visible `:focus-visible` ring on links and buttons.
- **Tests**: extend `tests/e2e/home.spec.ts`: each home `h2` is visible and its accessible name has no number.
- **Perf**: none (CSS only). **Size**: M. **Depends on**: nothing.

#### 0.2 `NN: Content rises into view on scroll, and all motion respects the reduce setting`

- **Outcome**: entries, cards and skill groups fade and rise as they enter the viewport.
- **Files**: `src/styles/global.css`: a `.reveal` class inside `@media screen and (prefers-reduced-motion:
no-preference)` and `@supports (animation-timeline: view())`, keyframes from `opacity: 0; translate: 0 16px`,
  `animation-range: entry 0% entry 35%`; move `scroll-behavior: smooth` (`global.css:11-13`) into the same media
  query. Add `class="reveal"` in `ExperienceEntry.astro`, `ProjectEntry.astro`, `SkillsGrid.astro`, `Downloads.astro`.
- **JS**: none. **No JS / no support (Firefox today) / reduced motion / print**: content is simply visible.
- **A11y**: opacity and translate only, no layout movement.
- **Tests**: new `tests/e2e/motion.spec.ts`: with `reducedMotion: "reduce"` a below-the-fold `.reveal` has opacity 1
  and no animation; with JavaScript disabled every section's text is visible; after scrolling to `#skills` its
  groups reach opacity 1.
- **Perf**: compositor-only. Risk: Lighthouse accessibility could score below-the-fold text at opacity 0 as low
  contrast; check the CI Lighthouse job, and fall back to a translate-only reveal if it does.
- **Size**: S. **Depends on**: nothing.

### Phase 1: first impression

#### 1.1 `NN: Hero shows status badges, employers and KPI tiles`

- **Outcome**: at a glance: open to work (live dot), where he is, who he worked for, three outcome numbers as
  dashboard tiles that enter in sequence.
- **Files**: `src/components/Hero.astro` (105 lines); `src/site/profile.ts` (add `AVAILABILITY_BADGES`, short
  labels of the facts in `AVAILABILITY`, `profile.ts:28-32`: "Open to work", "Onsite, hybrid or remote", "Open to
  relocation"); `src/pages/index.astro` passes the unique `org` values of the experience collection (already
  loaded, `index.astro:27`) as an `employers` prop.
- **Reuses**: `HERO_STATS` (`profile.ts:26`), `LOCATION` (`src/site/contact.ts:7`), `.card` and `.chip` from 0.1.
- **JS**: none. Entrance is a CSS keyframe with a per-item delay; the `h1` does not animate (it is the largest
  paint). **Reduced motion**: static tiles and a static dot.
- **A11y**: badges are a `<ul>`; the dot is decorative; the availability sentences stay as text.
- **Tests**: `home.spec.ts` must keep passing as written: `.proof li` count 3 (`:43`), hero contains "open to
  relocation" in that case (`:44`), no `.stats` on the home page (`:22`). Add: badge list has 3 items; employers
  line names Nesma Airlines, Nile Air and Air Arabia.
- **Perf**: low. `public/og.png` needs no regeneration (tagline and stats unchanged, README "Regenerating the
  preview image").
- **Size**: M. **Depends on**: 0.1.

#### 1.2 `NN: Hero carries a chart of before and after results`

- **Outcome**: on wide screens the hero's second column is a results card: annual revenue 1.6 to 5.0 USD M, seat
  utilisation 71% to 81% (`src/content/experience/nesma-revenue-manager.md:9-17`), unmatched baggage records 66% to
  under 1% (`src/content/projects/operational-log-parser.md:18-23`). On narrow screens it sits under the buttons.
- **Files**: `Hero.astro` (two-column grid from 60rem, a default `<slot />`); `index.astro` fills the slot with
  `<BeforeAfterChart>`; `src/components/charts/BeforeAfterChart.astro` gains a `title` prop (default "Results",
  `:18`).
- **Reuses**: `BeforeAfterChart` and `scale.ts` unchanged in logic; `results` front matter is the one home of the numbers.
- **JS**: none. **No JS / reduced motion**: the static SVG.
- **A11y**: each row already has `<title>` and `<desc>` (`BeforeAfterChart.astro:32-34`).
- **Tests**: `home.spec.ts`: hero contains 3 result rows and the text "1.6 USD M → 5.0 USD M".
- **Perf**: inline SVG, no image request; the largest paint stays text.
- **Size**: S. **Depends on**: 1.1. **Note**: the Nesma role shows the same two rows again under Experience
  (`ExperienceEntry.astro:29`); see open question 3.

#### 1.3 `NN: Result charts draw themselves when they come into view`

- **Outcome**: in every before/after chart the "after" dot slides from the "before" position and the link grows.
- **Files**: `BeforeAfterChart.astro` only: per-row `style="--dx: {x1 - x2}"`, keyframes on `circle.after` and
  `.link` driven by `animation-timeline: view()`, same guards as 0.2.
- **JS**: none. **No JS / no support / reduced motion**: the final chart.
- **A11y**: the text value beside each row never animates.
- **Tests**: `tests/e2e/project_page.spec.ts`: with reduced motion the `after` circle has no transform; the chart is
  still visible (`:13-16` keeps passing).
- **Perf**: transform only. **Size**: S. **Depends on**: 0.2 (same pattern).

### Phase 2: the work

#### 2.1 `NN: Projects as cards with a summary, headline numbers and the demo badge`

- **Outcome**: the home project list becomes a two-column card grid: poster, title, organisation, one-sentence
  summary, up to two numbers, stack chips. The 4 to 11 bullets per project leave the home page and stay on the
  project page, so the home page gets much shorter.
- **Files**: `src/components/ProjectEntry.astro` (88 lines, rewritten as the card); new
  `src/components/metrics/MetricChips.astro` (value and label chips; class `.metric-chips`, not `.stats`);
  `index.astro` wraps the list in a grid; `README.md` layout.
- **Reuses**: `summary` (described as "used on cards", `src/content.config.ts:71`), `metrics`, `StackTags`,
  `hasDemo` and `demoDuration` (`src/components/projects/demos.ts`), posters in `public/demos/*/`.
- **JS**: none new. `ProjectFilter` (`client:idle`, `index.astro:60`) keeps working through `data-project` and
  `hidden` (`ProjectFilter.tsx:45-50`). Trap: a card root with its own `display` overrides `hidden`; add
  `[data-project][hidden] { display: none }`.
- **No JS**: all cards show, links work.
- **A11y**: one link per card to the project page (the title, stretched over the card with `::after`), so the
  link count asserted at `home.spec.ts:87` stays 1; the poster link to `#demo` stays a separate link.
- **Tests**: `home.spec.ts:79-105` keep passing (count, order, one link each, badge text). Add: each card shows its
  summary and no card contains a `<ul>` of bullets; `filter_island.spec.ts` unchanged and green.
- **Perf**: better: less DOM. **Size**: M. **Depends on**: 0.1.
- **Note**: printing the home page no longer includes project bullets (the PDF CVs cover print).

#### 2.2 `NN: Each project page shows how the work flows, as a pipeline`

- **Outcome**: a "How it works" strip of 4 stages with arrows on every project page, for example "Raw operational
  logs (68 million records) → Parser → Matched bags → Revenue checks".
- **Files**: new `src/components/projects/PipelineStrip.astro` (server-rendered `<ol>`, horizontal from 48rem,
  vertical below); `demos.ts` gains `pipelines(slug)` returning heading, caption and stages of each `pipeline` shot;
  `src/pages/projects/[slug].astro` renders it above the demo; `README.md`.
- **Reuses**: `public/demos/<slug>/spec.json` is the one home of the stages (all six specs have a pipeline shot;
  customer-route has two). The glob in `demos.ts:2-5` already loads them.
- **JS**: none. **Reduced motion / no JS**: static strip; with motion, stages light in sequence using `.reveal`.
- **A11y**: ordered list with an `aria-label` that names the step count; arrows are CSS and decorative.
- **Tests**: `project_page.spec.ts`: `/projects/operational-log-parser/` has a 4-item list starting "Raw operational logs".
- **Perf**: none. **Size**: S. **Depends on**: nothing (0.2 for the stagger).

#### 2.3 `NN: Featured projects lead with a real dashboard screenshot`

- **Outcome**: projects that have screenshots (the three #75 puts first) render as full-width rows: the first
  screenshot, summary, pipeline strip, "Watch the demo" and "Read the case study". The other three stay cards.
- **Files**: new `src/components/projects/FeaturedProject.astro`; `index.astro` picks it when
  `screenshots.length > 0` (no new front matter field); `README.md`.
- **Reuses**: `astro:assets` `<Image>` with `widths` and `sizes` as in `ScreenshotGallery.astro:18`, the
  screenshot's own `alt`, `PipelineStrip`, `MetricChips`, `StackTags`; carries `data-project` for the filter.
- **JS**: none. **No JS / reduced motion**: static.
- **A11y**: alt text already mandatory in the schema (`content.config.ts:81`). "Read the case study" is the
  title link itself (one link per project page inside `#projects`, as `home.spec.ts:87` asserts).
- **Tests**: `home.spec.ts`: the first three `[data-project]` each contain a screenshot `img` with non-empty `alt`;
  order test (`:79-89`) unchanged.
- **Perf**: three lazy images, explicit width and height (no layout shift). If Projects moves above Experience
  (item 2.4) the first image can enter the first viewport on desktop: keep `loading="lazy"`, serve WebP at 480 and
  960 wide, and watch the Lighthouse performance score (floor 0.9, `lighthouserc.json:9`).
- **Size**: M. **Depends on**: 2.1, 2.2.

#### 2.4 `NN: Projects come before experience on the home page` (needs the owner's yes, open question 1)

- **Outcome**: hero, profile, projects, experience, skills, education, CV. Visual proof first; the hero's
  employers line (1.1) already answers "where has he worked".
- **Files**: `index.astro` (move one block), `Nav.astro:6-11` (link order). **Tests**: `home.spec.ts`: `#projects`
  precedes `#experience` in the document.
- **JS / a11y / perf**: none beyond 2.3's note. **Size**: S. **Depends on**: 1.1, 2.3.

#### 2.5 `NN: Play a project's demo in place on the home page`

- **Outcome**: clicking a poster swaps it for the playing demo inside the card, with no page change.
- **Files**: new `src/components/projects/inline_demo.ts` (about 20 lines: on click of `a.poster`, replace its
  content with the iframe that `Demo.astro:25-31` uses, then focus it); imported by a `<script>` in
  `ProjectEntry.astro` and `FeaturedProject.astro`; `README.md`.
- **Reuses**: the generated demos and the player, which autoplays when visible (`player.js:159-162`) and follows the
  theme through the storage event (`public/theme.js:37-41`).
- **JS**: plain component script, not an island. **No JS**: the poster stays a link to the project page's
  `#demo` (`ProjectEntry.astro:26`). **Reduced motion**: the script does nothing and the link navigates (the player
  only shows its final frame then, `player.js:29,123`).
- **A11y**: iframe keeps its `title`; focus moves into it; the card's title link still reaches the full page.
- **Tests**: `home.spec.ts`: click the first poster, an iframe with `src="/demos/<slug>/"` appears in that card;
  with JavaScript disabled the click navigates to `/projects/<slug>/#demo`.
- **Perf**: zero cost until a click. **Size**: S. **Depends on**: 2.1.

#### 2.6 `NN: Numbers count up when they scroll into view`

- **Outcome**: the numbers on project cards, featured rows and project-page tiles ("68M", "1,305", "~660×",
  "~9 min") count up once as they enter the viewport.
- **Files**: new `src/components/metrics/count_up.ts` (a pure `splitNumber("~660×")` giving prefix, number,
  decimals, suffix, plus an IntersectionObserver and requestAnimationFrame ease-out of about 800 ms); `data-count-up`
  on the value in `MetricChips.astro` and `Stats.astro`; new `tests/unit/count_up.test.mjs`; `README.md`.
- **Reuses**: the displayed `value` string is the only source; no second numeric field.
- **JS**: component script, not an island. Only elements outside the viewport when the script starts are animated,
  so nothing above the fold flashes. The script fixes each element's width to its final width first and the numbers
  use tabular figures, so nothing shifts.
- **No JS / reduced motion**: the final value, which is what the HTML holds.
- **A11y**: the text before and after the animation is the real value; no live region.
- **Tests**: unit: `splitNumber` on "68M", "USD 1.5M", "~660×", "1,305", "~9 min", "90 days", "3×". e2e in
  `motion.spec.ts`: with reduced motion the text never changes; otherwise it ends equal to the server text.
- **Perf**: one observer, text writes on at most a dozen nodes. **Size**: S to M. **Depends on**: 2.1.

#### 2.7 `NN: Screenshots open full size in a lightbox`

- **Outcome**: a click on a project screenshot opens it large, with its caption; Escape or a click outside closes.
- **Files**: `src/components/projects/ScreenshotGallery.astro` (40 lines): each image wrapped in a link to its
  full-size file (`getImage` from `astro:assets`), one native `<dialog>`, a `<script>` of about 15 lines calling
  `showModal()`; `lighthouserc.json` gains `/projects/customer-route-analytics-power-bi/` so a screenshot page is
  measured (a stricter gate, not a looser one).
- **JS**: component script. **No JS**: the link opens the full image. **Reduced motion**: no open animation.
- **A11y**: `<dialog>` gives focus trap, Escape and focus return natively; the close button has a text name.
- **Tests**: `project_page.spec.ts`: click the first screenshot, dialog is open and holds the image; Escape closes
  it and focus is back on the link.
- **Perf**: full-size image loads only on click. **Size**: S to M. **Depends on**: nothing.

#### 2.8 `NN: Project pages open as a morph from their card, with next and previous links`

- **Outcome**: the title and poster glide from the card into the project page; each project page ends with links to
  the previous and next project.
- **Files**: `global.css` (`@view-transition { navigation: auto; }` under the motion media query); inline
  `view-transition-name: project-<slug>` on the card title and on the page `h1`; `[slug].astro` (53 lines) gets the
  two links from the ordered collection.
- **JS**: none. **No support / reduced motion**: a normal page load.
- **A11y**: a `<nav aria-label="More projects">`. **Tests**: `project_page.spec.ts`: the next link of the first
  project goes to the second in home order.
- **Perf**: none. **Size**: S. **Depends on**: 2.1.

### Phase 3: career story and depth

#### 3.1 `NN: Experience as a timeline`

- **Outcome**: a vertical rail with a dot per role, the dates set in the rail on wide screens, the current role
  marked. Deliberately not drawn to scale: a scaled bar would put the 2016 and 2021 to 2022 gaps on show
  (`air-arabia.md:5`, `nile-air-head-of-revenue.md:5-6`, `nesma-revenue-manager.md:5`).
- **Files**: `src/components/ExperienceEntry.astro` (30 lines; scoped styles, a `<time>` per date). **JS**: none.
- **A11y**: the list of roles becomes an `<ol>`; dates in `<time datetime>`. **Tests**: `home.spec.ts`: 4 roles in
  an ordered list, first one says "Present".
- **Perf**: none. **Size**: S. **Depends on**: 0.1.

#### 3.2 `NN: Each role leads with its headline numbers`

- **Outcome**: two or three number chips under each role title, before the bullets.
- **Files**: `src/content.config.ts` (optional `metrics` on experience, reusing `metric`, `:22-25`);
  `src/content/README.md` field table; the four experience files; `ExperienceEntry.astro` renders `MetricChips`.
  Follow the `resume-update` skill; check `scripts/cv/generate.mjs` ignores the new key.
- **Content, all already stated in the files** (Kareem confirms the pick, content ask 2):
  - Nesma, Revenue Manager: team 1 to 5 (`nesma-revenue-manager.md:7`), USD 1.5M refund backlog cleared (`:21`),
    136-field transaction table (`:23`), average fare up 37% (`:29`).
  - Nile Air: 4 route controllers and yield executives led (`nile-air-head-of-revenue.md:7`), 5 partner agreements
    (3 interline, 2 codeshare, `:14`), 3-year outsourced audit (`:17`).
  - Nesma, consultant: 5-day, 15-hour AI course (`nesma-data-ai-consultant.md:11`).
  - Air Arabia: 3 airports of Umrah group bookings for a season (`air-arabia.md:10`), 3 weeks of manual servicing
    (`:11`).
- **Readers**: pages only; `/llms.txt` and `/resume.json` unchanged (the bullets already state the numbers).
- **JS**: count-up from 2.6 applies. **Tests**: `home.spec.ts`: the Nesma Revenue Manager entry shows "37%".
- **Perf**: none. **Size**: M. **Depends on**: 2.1 (`MetricChips`), 3.1.

#### 3.3 `NN: Roles link to the projects built in them`

- **Outcome**: "Projects from this role" chips on a role, each linking to its project page.
- **Files**: `ExperienceEntry.astro` (reads `projects`, which exists in the schema, `content.config.ts:105-108`, and
  is ignored today, `ExperienceEntry.astro:13`); experience files once Kareem supplies the mapping (only the
  consultant role lists one today, `nesma-data-ai-consultant.md:8`).
- **JS**: none. **A11y**: plain links. **Tests**: `home.spec.ts`: the consultant role links to
  `/projects/daily-revenue-pipeline/` (the `:87` link-count check is scoped to `#projects`, so it is unaffected).
- **Size**: S. **Depends on**: content ask 1.

#### 3.4 `NN: Airline terms explained on tap`

- **Outcome**: terms such as ATPCO, BSP, ADM and churning carry a dotted underline; a tap or click opens a short
  plain-words definition. A recruiter outside airlines can follow every bullet.
- **Files**: new `src/site/knowledge/glossary_split.ts` (pure: split a sentence into text and term parts, whole
  words only, first hit per term); new `src/components/glossary/GlossaryText.astro` (renders the parts; a term is a
  `<button popovertarget>` plus a `popover` element with a unique id); used for bullets in `ExperienceEntry.astro`
  and `[slug].astro`; new `tests/unit/glossary_split.test.mjs`; `README.md`.
- **Reuses**: `GLOSSARY` (`src/site/knowledge/glossary.ts`), `smartQuotes` (`src/site/bullets.ts:17-22`) applied per
  text part.
- **JS**: none: the Popover API is HTML. **No JS**: works. **Print**: plain text.
- **A11y**: real buttons, Escape and click-away close natively, focus returns to the term.
- **Tests**: unit: split around "ATPCO" and no match inside a longer word. e2e in `home.spec.ts`: click "ATPCO" in
  the Nile Air role, the definition is visible; Escape hides it.
- **Perf**: a few dozen extra nodes. **Size**: M. **Depends on**: nothing.

#### 3.5 `NN: Skills as chip groups`

- **Outcome**: each skill group is a card of chips with its "Proven by" links beneath.
- **Files**: `src/components/SkillsGrid.astro` (61 lines): `<StackTags stack={data.items} />` replaces the comma
  join (`:21`). **Reuses**: `StackTags`, `.card`. **JS**: none.
- **Tests**: `home.spec.ts`: `#sql-and-databases` holds 7 chips and a link to a project page.
- **Size**: S. **Depends on**: 0.1.

### Phase 4: conversion and the assistant

#### 4.1 `NN: A closing contact section`

- **Outcome**: the page ends with email, LinkedIn, the availability lines and an "Ask the assistant" button, right
  after the CV cards.
- **Files**: new `src/components/sections/Contact.astro`; `index.astro`; `README.md`.
- **Reuses**: `src/site/contact.ts`, `AVAILABILITY`, the `data-chat-open` hook (`src/islands/ChatWidget.tsx:80-92`),
  hidden when `CHAT_ENABLED` is false (`src/site/chat.ts:8`).
- **JS**: none new. **No JS**: the button does nothing; hide it with the same hydrated pattern the filter uses, or
  leave email as the working path. **Tests**: `home.spec.ts`: `#contact` has a `mailto:` link and a LinkedIn link.
- **Size**: S. **Depends on**: 0.1.

#### 4.2 `NN: Buttons that ask the assistant a ready question`

- **Outcome**: "Ask about this project" on every project page and two starter questions in the hero open the chat
  and send the question in one click.
- **Files**: `src/islands/ChatWidget.tsx` (140 lines: read `data-chat-prompt` from the clicked `[data-chat-open]`
  element, pass it down), `src/islands/ChatPanel.tsx` (114 lines: send it through the same `send` the starter chips
  use, `:63-75`); `[slug].astro` and `Hero.astro` add server-rendered buttons.
- **Reuses**: `STARTER_CHIPS` (`src/site/chat.ts:12-41`) for the hero questions; the project `title` for the page.
- **Island**: existing `ChatWidget`, still `client:idle` (`src/layouts/Base.astro:53`); buttons are server-rendered
  and the island only reacts, as the rule requires.
- **No JS**: buttons are inert; keep them hidden until the widget hydrates.
- **A11y**: `aria-expanded` is already kept in step (`ChatWidget.tsx:64`); focus lands in the question box.
- **Tests**: extend `tests/e2e/chat_widget.spec.ts` with the mocking that spec already uses: clicking "Ask about
  this project" opens the dialog and the first user line is the prompt.
- **Perf**: none. **Size**: M. **Depends on**: nothing. Watch the complexity cap of 10 in `ChatWidget`.

#### 4.3 `NN: Nav marks the section in view and shows the CV link as a button`

- **Outcome**: the link of the section being read is highlighted; "Download CV" looks like a button.
- **Files**: `src/components/Nav.astro` (62 lines): a `<script>` of about 15 lines with one IntersectionObserver
  setting `aria-current="location"`; `.btn` on the CV link. If `:target-current` with `scroll-target-group` is
  supported in Safari and Firefox at build time, use that CSS instead and drop the script.
- **No JS**: no highlight, links work. **A11y**: `aria-current` is announced. Check the bar at 360px wide.
- **Tests**: `home.spec.ts`: after scrolling to `#skills`, that link has `aria-current`.
- **Size**: S. **Depends on**: nothing.

#### 4.4 `NN: View the site as a data analyst hire or a revenue manager hire` (stretch, open question 2)

- **Outcome**: a two-way switch in the hero changes the headline, the summary, the lead CV button, and marks the
  projects and skill groups that role's CV lists.
- **Files**: `Hero.astro`, `index.astro`, `global.css` (`html[data-role]` show and hide rules, the same pattern as
  `.only-light`), a small script next to `public/theme.js`'s pattern. **Reuses**: `CV_FILES` headline, summary,
  project and skill lists (`src/site/cv_files.ts:20-62`). Both variants are server-rendered; the switch only sets
  an attribute.
- **Tests**: new spec in `tests/e2e/home/`. **Size**: L. **Depends on**: 1.1, 2.1, 3.5.

## 3. Content asks (not in the repo; Kareem supplies)

1. Which role each project belongs to, for item 3.3 (customer-route analytics, revenue audit engine and the log
   parser are not tied to a role in the files).
2. His pick of two or three headline numbers per role from the candidates in item 3.2.
3. Publishable numbers for the two featured projects with `metrics: []`
   (`customer-route-analytics-power-bi.md:9`, `aerotrace-revenue-management.md:10`). Candidates already in their
   bullets: 4 dashboards (`customer-route-analytics-power-bi.md:27`); 9 monthly KPIs and a 14-day watchlist
   (`aerotrace-revenue-management.md:28-29`).
4. Optional: a headshot for the hero; one or two short recommendations (the counterpart of the reference's books and
   paper); participant count for the AI programme; a public repo or live link for AeroTrace.

## 4. Recommended order

First three PRs:

1. **0.1 Refreshed look** (M): every later item uses its card, chip and spacing tokens.
2. **2.1 Projects as cards** (M): the largest visible change and it removes most of the home page's length.
3. **1.1 Hero badges, employers and KPI tiles** (M): fixes the first five seconds.

Then: 0.2 reveal (S), 2.2 pipeline strip (S), 2.3 featured rows (M), 1.2 hero chart (S), 2.5 inline demo (S),
2.6 count-up, 1.3 chart draw, 3.1 timeline, 3.5 skills chips, 4.1 contact, 2.7 lightbox, 2.8 morph, 4.3 nav,
3.4 glossary, 4.2 assistant buttons, 3.2 and 3.3 once the content asks are answered, 2.4 and 4.4 once decided.

## 5. Where this beats the reference

- **Real dashboards, not descriptions**: Power BI, Excel and app screenshots with captions and alt text, zoomable (2.3, 2.7).
- **Playable demos**: six animated walkthroughs, started in place from the home page (2.5).
- **An assistant that answers from his record**, one click from the hero and from each project (4.2).
- **Charts instead of a terminal**: before/after results drawn as charts that animate into place (1.2, 1.3).
- **Every skill linked to the project that proves it**, and every role to its projects (3.3, 3.5).
- **Jargon explained**: airline terms open a plain-words definition (3.4).
- **A CV per target role**, plus `/llms.txt` and `/resume.json` for recruiters' tools.
- **Works with JS off, with motion off, in light or dark, on a phone**, and stays inside the Lighthouse budget
  because nearly all motion is CSS.

## 6. Open questions

1. Move Projects above Experience (2.4)? Recommended yes, once the hero names the employers.
2. Build the role switch (4.4)? It is the only L item and the most distinctive one; skip if the two CV buttons are enough.
3. The hero chart (1.2) repeats two rows shown again under the Nesma role. Keep both, or drop the chart from the role?
4. Home project cards drop the bullets (2.1); they stay on project pages. Acceptable, including for printing the home page?

## 7. Not verified

- No build, test or Lighthouse run (read-only scope): current scores and the look at each width are unknown.
- Browser support for `animation-timeline: view()`, cross-document view transitions, `:target-current` and the
  `content: ... / ""` alt syntax is from memory, not checked today. Each item degrades to a static page without them.
- The reference's CSS was not read; its look is inferred from its HTML and script.
- How `chat_widget.spec.ts` mocks the Worker, and whether `scripts/cv/generate.mjs` tolerates a new experience key,
  were not read in depth (items 4.2, 3.2).
