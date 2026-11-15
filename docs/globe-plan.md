# Globe backdrop spec: from hero decoration to a scroll-driven, theme-aware backdrop

Goal: the hero globe (PR #103) becomes one fixed, centred layer behind the page that changes look with the theme
and follows the career story as the visitor scrolls. Eight PR-sized items, in build order.

Read from `origin/main` at `69c57f2` (PR #99 merged). Nothing was built, installed or run against the site. Two
read-only calculations were run in a scratch folder (contrast ratios from the palette, and the size of a still
globe drawn from `public/globe/land.png`); their numbers are quoted where used. File and line references are to
`origin/main`.

## Owner decisions (2026-11-15)

These answer the open questions in section 5 and override the text below where they differ.

- Project pages get the **live** globe, not the still or nothing.
- Opacity **0.15 behind the text column** (0.25 in the gutters) is accepted as the starting point.
- Reduced motion: a **still view per section** (the globe re-orients per section without spinning).
- Item 8 (the hero opens on a large globe that shrinks into the backdrop) is **wanted**.
- Home section order on main since #100/#101: hero, chat showcase band, profile, projects, experience, skills,
  education, download, contact. Section 1 of this spec was read before those merged.
- Item 5 waits on Kareem: each era's base and real destinations.

## 0. Rules every item follows

- One feature per PR, branch `feature/NN-short-name` (`chore/NN-...` for item 2), title `NN: <feature>`
  (`AGENTS.md`). NN below is a placeholder.
- `fable-code` rules and handoff block on every change, paired with `ponytail`. `npm run check` before commit,
  `npm run build && npm run test:e2e` before push. README layout (`README.md:20,35,49`) and `scripts/README.md`
  updated in the same commit when a file is added or moved.
- **No new dependency.** `three` and `sharp` are already dev dependencies (`package.json:43-44`).
- **No React.** The backdrop is an `.astro` component with a `<script>`; story stops are server-rendered `data-`
  attributes on markup that already exists, so the islands rule holds by construction.
- Colours only from `public/theme.css` tokens. No silencing, no loosened config.
- Folder caps that shape the file list (`scripts/check_layout.mjs:14-18`; it also walks `tests/`):

  | Folder                 | Loose now | Consequence                                                                                                                   |
  | ---------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------- |
  | `src/components/hero/` | 3         | ends at 7: `GlobeBackdrop.astro`, `globe_scene`, `globe_routes`, `globe_geometry`, `globe_look`, `globe_story`, `globe_sweep` |
  | `src/components/`      | 8 (full)  | the shared scroll observer goes in a new `src/components/scroll/`                                                             |
  | `src/site/`            | 8 (full)  | the city list goes in a new `src/site/geo/`                                                                                   |
  | `tests/e2e/home/`      | 8 (full)  | item 1 moves `globe.spec.ts` into a new `tests/e2e/home/globe/`; every new globe spec goes there                              |
  | `tests/unit/`          | 8 (full)  | new `tests/unit/globe/`; the `test:unit` glob (`package.json:18`) only reads the top level, so item 2 widens it               |
  | `scripts/globe/`       | 1         | room for the still generator (item 3)                                                                                         |

## 1. Current state

- **Where it sits.** `HeroGlobe.astro` renders one empty `aria-hidden` div inside the hero `<header>`
  (`src/components/Hero.astro:22-23`), absolutely positioned at the header's right edge, `z-index: -1`, clipped
  (`src/components/hero/HeroGlobe.astro:38-52`). The header isolates it (`Hero.astro:82-85`). A script measures
  the distance to the body's content edge so the chat dock never causes sideways scroll (`HeroGlobe.astro:15-21,24`).
- **Loading.** Only at 48rem and wider, after `load` plus two idle periods, as a lazy chunk
  (`HeroGlobe.astro:12,23-33`). The width is checked once; a later resize does not mount it. PR #103 measured
  the chunk at about 129 KB gzipped.
- **Scene.** 65,000 Fibonacci points filtered by the land mask (about 18,700 land dots, measured), an occluding
  sphere, 8 arcs from Cairo (`globe_scene.ts:23-45,72-104`; `globe_routes.ts:35-45`). 30 fps cap
  (`globe_scene.ts:28,113`), one turn per 75 s (`globe_scene.ts:26,114`). Pixel ratio capped at 2
  (`globe_scene.ts:90`); the box is at most 720 px, so at most about 2.07 megapixels are drawn.
- **Pausing.** The loop stops when the box is off-screen, the tab is hidden, the visitor prefers reduced motion,
  or WebGL runs on the CPU; the last two show a still globe with every arc drawn (`globe_scene.ts:47-53,106-125,143-148`).
- **Theme.** Three colour probes on the box (`color`, `border-color`, `outline-color`: `HeroGlobe.astro:37-41`)
  are read by `colours()` on every theme change (`globe_scene.ts:126-132,149-153`). One token exists,
  `--globe-dot` (`public/theme.css:15-16`). The toggle only sets `html[data-theme]` (`public/theme.js:18-32`,
  `ThemeToggle.astro:46-48`).
- **Cities.** `ORIGIN` and `DESTINATIONS` are typed in `globe_routes.ts:35-45`. Experience `location` is free
  text, "Cairo" three times and "Egypt and UAE" once (`src/content/experience/*.md`, `src/content.config.ts:100`);
  it has no coordinates.
- **Phones, no JS, print.** Under 48rem the layer is `display: none` and nothing is downloaded; no JS shows
  nothing; print hides it (`HeroGlobe.astro:42,60-75`). `tests/e2e/home/globe.spec.ts:24-36` pins the phone case.
- **Page.** Section order on main is hero, profile, experience, projects, skills, education, download, contact
  (`src/pages/index.astro:50-102`). **Experience comes before Projects, and there is no chat showcase band on
  main or in an open PR**, so the story below follows that order.
- **Text surfaces.** `.card` is opaque (`src/styles/global.css:168-173`), but the profile paragraph, every
  experience bullet, the education list and all headings sit directly on `--bg` (`ExperienceEntry.astro:20-50`,
  `index.astro:54-99`). A backdrop behind the column is therefore behind running text, not only behind cards.
- **Chat dock.** `ChatWidget` sets `--chat-dock-width` on `<html>` and removes it on undock
  (`src/islands/ChatWidget.tsx:71-80`); the body pads by it at 48rem and wider (`global.css:61-64`).
- **Lighthouse.** Floor 0.9 performance, 0.95 accessibility, on `/` and two project pages
  (`lighthouserc.json:5-17`). No desktop preset, so the run uses Lighthouse's default phone emulation (about
  412 px wide), which is under 48rem: **Lighthouse has never measured the WebGL globe, and will not measure it
  after this work either.** PR #103's description says the same.

## 2. Decisions

1. **The layer lives in `Base.astro`, as the first child of `<body>`.** A `z-index: -1` layer inside the hero's
   isolated header would paint above the text of later sections. In the root stacking context it paints above
   the page background (the body's `--bg` propagates to the canvas because `<html>` has none) and below all
   content. Consequence: no rule may ever give `<html>` a background.
2. **Live WebGL on the home page only; every other page gets the still.** Project pages have no story stops, so
   a live scene there would cost 129 KB to draw one frame identical to the still.
3. **Two opacity levels, set by measured contrast, not taste.** The layer is 0.25 in the gutters and 0.15 behind
   the 860 px text column, done with one horizontal `mask-image` gradient on the layer (soft 80 px edges, built
   from `--maxw`, `global.css:6`). That is the owner's "15 to 25%" and "text never sits over the brightest part".
   Measured worst case for `--muted`, the weakest text token, over one fully painted backdrop pixel:

   | Effective opacity behind text | Light, ink-blue `#003566` | Dark, amber `#ffc300` | Dark, white (additive glow saturating) |
   | ----------------------------- | ------------------------- | --------------------- | -------------------------------------- |
   | 0.15 (chosen)                 | 5.04:1                    | 7.15:1                | 6.34:1                                 |
   | 0.20                          | 4.57:1                    | 6.28:1                | 5.29:1                                 |
   | 0.25                          | 4.12:1 fails              | 5.44:1                | 4.37:1 fails                           |

   So 0.20 is the hard ceiling behind text and 0.15 leaves margin. Both numbers are custom properties on the
   layer (`--globe-opacity`, `--globe-column`) so a test can read them (item 1).

4. **Scroll mechanism: one `IntersectionObserver` over the story stops, the pattern `Nav.astro:31-42` already
   uses.** The story is a handful of discrete states (which base, which routes), and the camera eases to each
   one in time, not in scroll distance.

   | Option                          | Verdict                                                                                                                                                                                                              |
   | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `ScrollTimeline` / `view()`     | Cannot drive WebGL without reading an animated custom property every frame; unsupported browsers get nothing. **Used only for item 8**, which is pure CSS on the layer, guarded like `.reveal` (`global.css:32-38`). |
   | One passive scroll listener     | Gives continuous progress nobody needs, and costs a layout read per scroll frame for seven state changes.                                                                                                            |
   | `IntersectionObserver` per stop | **Chosen.** No scroll handler, no layout reads, fires only on a change, already proven in the nav.                                                                                                                   |

   The observer config moves out of `Nav.astro` into `src/components/scroll/reading_line.ts` so the nav and the
   globe share one home for "the element crossing the reading line" (rule 4, one home per concept).

5. **Rotation is yaw only, eased by exponential decay.** The camera sits 22.8 degrees above the equator
   (`globe_scene.ts:95`, measured) and every base is between 21 and 30 degrees north, so turning about the
   vertical axis alone brings each base to the centre. `yawFor(lon) = atan2(cameraX, cameraZ) - lon`; for Cairo
   that is -2.78 rad, which matches today's hand-tuned `START_ROTATION = -2.7` (`globe_scene.ts:29`). Each frame:
   `yaw += shortestTurn(target - yaw) * (1 - exp(-dt / 450 ms))`. It is frame-rate independent, takes the
   short way round, and can be retargeted mid-turn, so a fast scroll past three roles never queues three turns.
   A 60 degree turn settles under 1 degree in about 1.8 s. Mark it `ponytail: yaw only; add tilt when a base far
from 23N is added`.
6. **Zoom is CSS `scale` on the box, not camera distance.** The CSS rim and the still follow for free, the
   canvas is never resized, and it runs on the compositor.
7. **The loop runs only while something moves.** A fixed backdrop is always on screen, so "pause off-screen"
   alone would mean 30 fps for the whole visit. The loop runs while the globe spins (hero stop), eases, draws or
   pulses arcs, or sweeps; otherwise it renders one frame and stops. Tab hidden still stops it. The box's own
   `IntersectionObserver` stays, because it catches the layer being hidden by a resize under 48rem.
8. **Never draw more pixels than today.** The box grows from 720 px to about 1000 px, so the pixel ratio becomes
   `min(devicePixelRatio, 2, sqrt(2.1 MP / (width x height)))`. The dimmed dots do not show the difference.
9. **Reduced motion: the globe re-orients per section with a single still frame, and never animates.** No spin,
   no easing, no arc drawing, no zoom, no sweep; when the stop changes, the globe is drawn once at the new yaw
   with that stop's arcs complete. Justification: the harm reduced motion guards against is movement across the
   field of view, and a one-frame change of a 15% backdrop has none; freezing it entirely would withhold the
   story (which role was where) from exactly those visitors. This is also the path software WebGL takes, so it
   is the path CI exercises.
10. **The still is one generated vector shape, coloured by the theme tokens at paint time.** A `<div>` with
    `background: var(--globe-dot)` and `mask: url(/globe/still_land.svg)`; a second for the arcs. One shape
    serves both themes, so its colours cannot drift from `public/theme.css`. It has no `<img>` and no
    `background-image`, so it adds no candidate for largest contentful paint, which matters because the phone is
    the only thing Lighthouse measures. Kept in sync by a `--check` mode in `npm run check`, the same way the CV
    files are (`scripts/cv/generate.mjs:86-102`).
11. **One home for cities: `src/site/geo/cities.ts`.** A record keyed by id with name, lat, lon, plus `HOME` and
    `HUBS`. The scene, the still generator and the content schema all read it; experience front matter refers to
    cities by id, validated at build time. `location` stays display text. It moves out of `globe_routes.ts`
    because the content schema must import it and `src/site` is the data layer.
12. **Night or paper is derived from the background probe's lightness**, not from a second copy of the "dark is
    active" conditions that `public/theme.css:25-39` says live in one place.
13. **The theme sweep uses clipping planes on the one canvas**: two render passes per frame for 0.9 s, old look
    on one side of a plane through the globe's centre, new look on the other, the plane turning through 180
    degrees. No shader code, no second canvas.

## 3. Work items

Sizes: S = under about 80 changed lines, M = 80 to 250, L = more or cross-cutting. Owner idea 1 is items 1 to 3,
idea 2 is item 4, idea 3 is items 5 and 6, idea 4 is item 7, idea 5 is item 8.

### 1. `NN: The globe is one centred backdrop behind the whole home page`

- **Outcome**: on desktop the globe leaves the hero's right edge and sits large, centred and dim behind the page
  for its whole length. It spins while the hero is in view and holds still below it (today's GPU cost, kept
  until item 5 replaces it).
- **Files**
  - `git mv src/components/hero/HeroGlobe.astro src/components/hero/GlobeBackdrop.astro`. Markup:
    `<div data-globe aria-hidden="true"><div data-globe-box></div></div>`. Layer: `position: fixed; inset: 0;
right: var(--chat-dock-width, 0px); z-index: -1; overflow: clip; pointer-events: none; display: grid;
place-items: center; opacity: var(--globe-opacity)` plus the column mask (decision 3). Box:
    `width: min(125vmin, 1200px); aspect-ratio: 1`, carrying the three probes unchanged. Delete `setBleed`, its
    `ResizeObserver`, `--globe-bleed`, the `translateX(30%)` and the 64rem opacity step
    (`HeroGlobe.astro:15-21,24,46,58,66-70`). Keep the idle loader verbatim (`:23-33`) and add a `.catch` so a
    failed WebGL context is silent. Under 48rem stays `display: none` in this item.
  - `src/layouts/Base.astro`: new prop `liveGlobe?: boolean`; render `<GlobeBackdrop />` first in `<body>` when
    set. `src/pages/index.astro:43-49` passes it.
  - `src/components/Hero.astro`: drop the import and `<HeroGlobe />` (`:10,23`), `position` and `isolation`
    (`:83-84`) and the two comments (`:3,87`); add `data-globe-stop="hero"` to `<header>`.
  - `src/components/hero/globe_scene.ts`: pixel budget (decision 8); `mountGlobe(box, spinWhile)` observes
    `spinWhile` (the hero header) instead of the box for the spin, keeps observing the box for visibility.
  - `git mv tests/e2e/home/globe.spec.ts tests/e2e/home/globe/backdrop.spec.ts`; new
    `tests/e2e/home/globe/contrast.spec.ts`. `README.md:20`.
- **Reuses**: the whole scene, the loader, the probes, `--maxw`, `--chat-dock-width`.
- **Reduced motion**: still globe, as today. **No JS / phone**: nothing, as today (item 3 fills this).
  **Print**: `display: none`, kept.
- **A11y**: `aria-hidden`, no pointer events, nothing focusable. Contrast per decision 3.
- **Tests**: `backdrop.spec.ts`: canvas visible at 1280 px; the layer is `position: fixed`; the canvas centre is
  within 2 px of the body content box centre with the dock closed and open; no sideways scroll in both; exactly
  one `<canvas>` in the document; hidden under `emulateMedia({ media: "print" })`; the three phone assertions
  unchanged. `contrast.spec.ts`: in each theme read the probes, `--globe-opacity`, `--globe-column` and the
  computed colour of a `--muted` element, blend each painted colour over `--bg` at the effective opacity, assert
  4.5:1 or better.
- **Perf**: Lighthouse sees no change on any page (phone path untouched). Desktop: same pixels per frame by
  decision 8; one extra compositor mask. Risk: the canvas now stays allocated for the whole visit.
- **Size**: M. **Depends on**: nothing.

### 2. `NN: Globe cities and geometry each have one home` (chore)

- **Outcome**: none visible. Makes the globe's data and maths importable by Node, which items 3 and 5 need.
- **Files**
  - New `src/site/geo/cities.ts`: `CITIES` (today's nine cities, keyed by id), `HOME = "cairo"`, `HUBS` (today's
    eight destinations), `CITY_IDS`. Erasable TypeScript only and no relative imports, so Node can import it the
    way `tests/unit/count_up.test.mjs:4` imports `count_up.ts`.
  - New `src/components/hero/globe_geometry.ts`, three-free and with no relative imports: `RADIUS`, `POINTS`,
    the camera position, distance and field of view, `latLonToXyz`, `yawFor`, `shortestTurn`, `landPoints(mask,
count)` (from `globe_scene.ts:34-45`) and `arcPoints` (from `globe_routes.ts:66-80`), all on plain number
    tuples.
  - `globe_scene.ts` and `globe_routes.ts` import from both and wrap tuples in `Vector3`; `START_ROTATION`
    becomes `yawFor(CITIES[HOME].lon)`; `ORIGIN`, `DESTINATIONS`, `latLonToVector` are deleted, not copied.
  - New `tests/unit/globe/geometry.test.mjs`; `package.json:18` glob becomes `tests/unit/**/*.test.mjs`.
    `README.md` layout, `tests/README.md:11`.
- **Tests**: `yawFor(31.24)` is -2.782 within 0.001; `shortestTurn` wraps both ways across pi; `landPoints` on a
  tiny half-white mask returns the same count twice; `arcPoints` starts and ends on the sphere.
- **Perf**: none. **Size**: S to M. **Depends on**: 1 (same files; avoids a conflict).

### 3. `NN: Phones and no-JS visitors get a still globe`

- **Outcome**: every page, at every width, with or without JavaScript, shows a still dotted globe facing Cairo
  with the hub routes, in the current theme's colours. On the home page at desktop width it is what shows until
  the live globe has drawn its first frame, in the same pose.
- **Files**
  - New `scripts/globe/make_still.mjs`: reads `public/globe/land.png` with `sharp` (as
    `make_land_mask.mjs:27` does), takes `landPoints` at 20,000 points, the camera constants and
    `yawFor(HOME)` from `globe_geometry.ts`, the cities from `cities.ts`, projects with `three`'s
    `PerspectiveCamera`, keeps points on the near side, and writes `public/globe/still_land.svg` (one `<path>`
    of round-capped zero-length segments in a 1000-unit viewBox) and `public/globe/still_routes.svg` (the eight
    arcs). Measured: about 3,270 dots, 32 KB, about 12 KB gzipped. `--check` regenerates in memory and exits 1
    with `globe: <file> stale, run npm run globe:still`.
  - `package.json`: script `globe:still`; append the `--check` call to `check`.
  - `GlobeBackdrop.astro`: two children in the box, `background: var(--globe-dot)` / `var(--accent)` with
    `mask: url(...) center / contain no-repeat`; the layer shows at every width; the canvas still mounts only at
    48rem and wider and only when `live`; `[data-globe-ready] .still { display: none }`, the attribute set by
    the scene after its first frame.
  - `Base.astro`: always render `<GlobeBackdrop live={liveGlobe} />`.
  - New `tests/e2e/home/globe/still.spec.ts`; `backdrop.spec.ts` phone test updated. `scripts/globe/README.md`,
    `scripts/README.md`, `README.md:35,49`.
- **Reuses**: the land mask, the geometry, the tokens, the `--check` pattern.
- **Reduced motion**: nothing moves. **No JS / phone**: this is their globe. **Print**: hidden with the layer.
- **A11y**: decorative, `aria-hidden`; `contrast.spec.ts` now also runs at 390 px and on a project page.
- **Tests**: with JavaScript off at 390 px and at 1280 px the still is visible with a mask image; a phone
  requests no three chunk, no `land.png`, and has no canvas; on desktop home the still is hidden once
  `data-globe-ready` is set; a project page has the still and no canvas.
- **Perf**: this is the only item Lighthouse can see. Expected on `/` and on both project pages: two more
  requests (about 12 KB and under 1 KB gzipped), no script, no layout shift, the same largest-contentful-paint
  element as on main, performance score within run-to-run noise. **Acceptance: the PR's Lighthouse report names
  the same LCP element as main.** If it names the still, fall back to inlining the path in the page.
- **Size**: M. **Depends on**: 1, 2.

### 4. `NN: Night-flight globe in dark, paper route map in light`

- **Outcome**: dark theme shows glowing amber land dots, arcs that read as light trails and a faint blue rim;
  light theme shows ink-blue dots on a cream disc with dashed arcs, like a printed route map.
- **Files**
  - `public/theme.css:15-16`: `--globe-dot: light-dark(#003566, #ffc300)`, new `--globe-arc:
light-dark(#003566, #ffd60a)`, `--globe-sea: light-dark(#fff3c2, #000814)`, `--globe-rim:
light-dark(transparent, #2f6aa8)`. Every value is already in the palette (`theme.css:2,13-14,16`). Replace
    the comment that says the dots need no contrast.
  - `GlobeBackdrop.astro`: probes become `color: var(--globe-arc)`, `border-color: var(--globe-dot)`,
    `outline-color: var(--globe-sea)`; rim as a `::after` ring, `radial-gradient` in `--globe-rim` at 46% of the
    box (the sphere fills 92%, `globe_scene.ts:30`); the still's arcs use `.only-light` / `.only-dark`.
  - New `src/components/hero/globe_look.ts`: owns the two looks and `applyLook(materials, style)`, called from
    `colours()`. Night: additive blending, a soft round dot sprite (a generated 64 px `CanvasTexture`), arcs
    brightening toward the head. Paper: normal blending, crisp dot, `LineDashedMaterial` arcs. Sets
    `data-globe-look` on the layer.
  - `make_still.mjs`: also writes `still_routes_dashed.svg`.
  - New `tests/e2e/home/globe/looks.spec.ts`.
- **Reuses**: the probes, `.only-light` / `.only-dark` (`theme.css:25-39`), the palette.
- **Reduced motion / no JS / phone**: the still carries the look (token colours, rim, dashed or solid arcs).
  **Print**: hidden.
- **A11y**: `contrast.spec.ts` adds white as a painted colour in the night look (additive dots can saturate).
- **Tests**: `data-globe-look` is `night` under `data-theme="dark"` and `paper` under `light`; the dot probe
  resolves to a different colour in each; the right still arcs are visible in each theme.
- **Perf**: no post-processing pass. The soft sprite raises overdraw; if a frame takes over 8 ms on an
  integrated GPU, keep additive blending and drop the sprite. Lighthouse: one more file under 1 KB.
- **Size**: M. **Depends on**: 3.

### 5. `NN: The globe turns to each role's base and draws that era's routes`

- **Outcome**: at the top the globe spins slowly with every hub route. As each role in Experience crosses the
  middle of the screen, the globe turns to that role's base and draws only the routes of that era.
- **Files**
  - `src/content.config.ts`: experience gains optional `globe: { base, routes }`, both `z.enum(CITY_IDS)`,
    strict and described. `src/content/README.md` table, `.claude/skills/resume-update/SKILL.md:38`.
  - `src/content/experience/*.md`: a `globe:` block each; new cities added to `cities.ts`. **Blocked on
    Kareem's answer (question K1); nothing in the repo states these routes.** `scripts/cv/latex.mjs:52` reads
    named fields only, so the CV output does not change.
  - `ExperienceEntry.astro:20`: `data-globe-stop="role" data-globe-base data-globe-to` when the entry has
    `globe`. `Hero.astro`: the header gains `data-globe-base={HOME} data-globe-to={HUBS.join(" ")}`.
  - New `src/components/scroll/reading_line.ts`: `observeReadingLine(elements, onEnter)` holding the
    `-45% 0px -50% 0px` margin; `Nav.astro:31-46` calls it.
  - New `src/components/hero/globe_story.ts`: reads the stops from the DOM, calls `observeReadingLine`, hands
    the active stop to the scene and mirrors it on the layer as `data-globe-at`, `data-globe-base`,
    `data-globe-to`.
  - `globe_scene.ts`: yaw target and easing (decision 5), run-only-while-moving (decision 7), the item 1 hero
    observer removed, `data-globe-running` on the layer. `globe_routes.ts`: one route per (base, destination)
    pair found in the stops; `setActive(pairs, mode)` with modes `cycle` (today's) and `hold` (draw once, one
    ripple, stay).
  - New `tests/e2e/home/globe/story.spec.ts`; `geometry.test.mjs` extended (easing converges, retarget mid-turn).
- **Reuses**: the nav's observer, `routePhase` / `applyPhase` (`globe_routes.ts:59-64,104-114`), `showAll`.
- **Reduced motion and software WebGL**: one still frame per stop (decision 9). **No JS / phone**: the still;
  the attributes are inert. **Print**: hidden.
- **A11y**: the globe adds no information; base and dates are already text in each role
  (`ExperienceEntry.astro:21-29`).
- **Tests**: scrolling each `.role` to the reading line sets `data-globe-at="role"` and that role's base and
  destinations on the layer; back at the top it is `hero`; with `reducedMotion: "reduce"` the same, and
  `data-globe-running` is `false`; the nav's current-section test still passes.
- **Perf**: less GPU than item 1 below the hero, since the loop stops once each turn settles. Lighthouse: a few
  hundred bytes of attributes.
- **Size**: L. **Depends on**: 2 (and 1).

### 6. `NN: The globe zooms out over Projects and settles on Cairo at Contact`

- **Outcome**: over Projects the globe pulls back and the hub routes pulse; at Contact it turns to Cairo and
  every route fans out once and stays, matching "open to relocation".
- **Files**: `index.astro:68` (`data-globe-stop="projects"`), `sections/Contact.astro:8`
  (`data-globe-stop="contact"`, base `HOME`, destinations `HUBS`); `GlobeBackdrop.astro`:
  `[data-globe-at="projects"] [data-globe-box] { scale: 0.8 }` with a 0.8 s transition, inside the
  no-preference media query; `globe_routes.ts`: modes `pulse` (arcs stay drawn, rings ripple in the existing
  stagger, for two 8 s cycles, then hold) and `fan` (all draw together, then hold); `story.spec.ts` extended.
- **Reduced motion**: no zoom, arcs complete, one frame. **No JS / phone / print**: unchanged.
- **Tests**: `#projects` and `#contact` at the reading line set `data-globe-at`; the box's computed `scale` is
  0.8 over Projects and none under reduced motion; `data-globe-running` returns to `false` after Contact.
- **Perf**: the pulse is the only animation that runs without a scroll; two cycles then it stops.
- **Size**: S. **Depends on**: 5.

### 7. `NN: Switching theme sweeps a day/night line across the globe`

- **Outcome**: flipping the airplane switch moves a curved day/night line across the globe in under a second,
  the old look on one side and the new on the other.
- **Files**: new `src/components/hero/globe_sweep.ts` (decision 13; 0.9 s, ease in-out; dark to light runs the
  other way); `globe_look.ts` keeps the previous look's colours for the old side; `globe_scene.ts`: a look change
  after the first frame starts a sweep instead of an instant swap, and counts as "moving"; `sweepAngle(t)` in
  `globe_geometry.ts` with a unit test. `ThemeToggle.astro` and `public/theme.js` are not touched: the existing
  `MutationObserver` (`globe_scene.ts:150-153`) is the trigger.
- **Reduced motion and software WebGL**: instant swap, as today. **No JS / phone**: token colours flip at once.
- **A11y**: one sub-second transition per click, far under three flashes a second.
- **Tests**: `looks.spec.ts`: toggling flips `data-globe-look`; under reduced motion `data-globe-sweeping` never
  appears. The sweep itself cannot be seen in CI (software WebGL takes the instant path); check it by hand.
- **Perf**: two passes per frame for 0.9 s per click. **Size**: M. **Depends on**: 4.

### 8. `NN: The hero opens on a large globe that shrinks into the backdrop` (optional)

- **Outcome**: at the top of the page the globe is larger and a little higher, behind the name; over the first
  70vh of scroll it shrinks and drifts into its backdrop position.
- **Files**: `GlobeBackdrop.astro` only: `@keyframes globe-arrive { from { transform: translateY(-6vh)
scale(1.35) } }` on the box with `animation-timeline: scroll(root)` and `animation-range: 0 70vh`, inside
  `min-width: 48rem`, `prefers-reduced-motion: no-preference` and `@supports (animation-timeline: scroll())`.
  It uses `transform` so it composes with item 6's `scale`. `backdrop.spec.ts` extended.
- **It is bigger, not brighter**: the opacity ceiling of decision 3 applies at the top too.
- **Reduced motion / no support / phone**: the globe starts in its backdrop position. **Print**: hidden.
- **Tests**: at the top the box has a transform, after scrolling one viewport it is the identity; none under
  reduced motion; no sideways scroll at the top.
- **Perf**: compositor only; the canvas is upscaled 1.35x at the top, which the dim dots hide. **Size**: S.
  **Depends on**: 1 (works with or without 3 to 7).

## 4. Constraint check

| Constraint                 | How it holds                                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------ |
| One WebGL canvas per page  | One box, one renderer; asserted in `backdrop.spec.ts`. No demo uses the `hero3d` shot today.     |
| 30 fps cap                 | `FRAME_MS` gate kept (`globe_scene.ts:28,113`).                                                  |
| Pause hidden or off-screen | Both observers kept; plus the loop stops whenever nothing moves (decision 7).                    |
| Idle lazy chunk            | Loader kept verbatim (`HeroGlobe.astro:23-33`).                                                  |
| Phones and no JS           | Generated still, token-coloured, checked in `npm run check` (item 3).                            |
| Reduced motion             | One still frame per stop, nothing animates (decision 9).                                         |
| Print                      | `display: none` on the layer.                                                                    |
| Lighthouse floor           | Only item 3 is visible to it; expectation and acceptance stated there.                           |
| No horizontal scroll       | Fixed layer with `overflow: clip`; tested with the dock open and at the item 8 start state.      |
| Chat dock width            | `right: var(--chat-dock-width, 0px)` on the layer; the measuring script is deleted.              |
| AA contrast                | Decision 3, enforced by `contrast.spec.ts` in both themes, on desktop, phone and a project page. |

## 5. Open questions

**For the owner**

- O1. Project pages: still globe only (specified), no globe, or the live one?
- O2. On a 1280 to 1440 px screen the 860 px column covers most of the globe, so most of it shows at 0.15. Is
  that enough presence, or should long text (experience bullets, profile) move onto `.card` surfaces so the
  backdrop can be stronger?
- O3. "Cream" in light theme is specified as the globe's disc in `#fff3c2`; the page background stays `#f7f9fc`.
  Right reading?
- O4. The brief lists Projects before Experience and a chat showcase band; main has Experience first and no
  band. The story follows main. Confirm.
- O5. Reduced motion: re-orient with one still frame per section (specified) or freeze completely?
- O6. Item 8: wanted at all, and on phones too (it would then scale the still)?
- O7. Ideas 1 and 3 are split into three and two PRs for size. Acceptable?

**For Kareem**

- K1. For each of the four roles: the base city and the real destinations of that era. Three roles are in Cairo
  and Air Arabia is "Egypt and UAE", so the turn between roles is at most about 24 degrees (Cairo to Sharjah);
  **the visible change will be the routes, not the rotation.** Should each era face the middle of its network
  instead of its base?
- K2. The eight hubs include New York, Beijing and Johannesburg, which the CV does not mention. Keep them as
  "all routes" for the hero and Contact, or replace them with real destinations?
- K3. Dot size and the 65,000 points were tuned for a 720 px box. At about 1000 px, should the dots grow or the
  count rise?
- K4. Is the soft-sprite glow acceptable in place of true bloom, which would need a post-processing pass?

## 6. Not verified

- Current Lighthouse scores and the current LCP element: nothing was run. That a CSS `mask` image is not an LCP
  candidate is from the LCP definition, not from a measurement here; item 3's acceptance test settles it.
- Whether Playwright in CI uses software WebGL (so takes the still path). Tests are written to pass either way.
- GPU frame times for the larger box, the soft sprite and the two-pass sweep: desktop only, invisible to
  Lighthouse, to be measured by hand in items 1, 4 and 7.
- That `make_still.mjs --check` is byte-stable between Node 22 (CI) and newer local versions; coordinates are
  rounded to whole units to make a difference unlikely.
- The still's file sizes are from a scratch calculation using the same sampling, not from the final script.
