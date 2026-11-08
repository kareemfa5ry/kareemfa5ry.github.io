# Demo design system

Every demo uses these and nothing else: no per-demo colours, fonts, sizes or easings. They live in
`assets/templates/player.html` (CSS custom properties and base classes) and the `MOTION` object in
`assets/templates/player.js` (handed to templates as `kit.motion`).

## Colour

Copied from `src/styles/global.css` (lines 10-17); each is `light-dark(light, dark)`, so the theme comes from
`color-scheme`, pinned by `html[data-theme]` from `?theme=` or left to the system.

| Token           | Light     | Dark      | Use                                                 |
| --------------- | --------- | --------- | --------------------------------------------------- |
| `--bg`          | `#f7f9fc` | `#000814` | page and stage background                           |
| `--surface`     | `#ffffff` | `#001d3d` | cards, tags, the control button                     |
| `--ink`         | `#000814` | `#e8eef7` | headings, numbers, body text                        |
| `--muted`       | `#4a5a70` | `#9fb1c9` | taglines, labels, captions                          |
| `--rule`        | `#d5deea` | `#14365f` | borders, connectors at rest                         |
| `--accent`      | `#003566` | `#ffc300` | the one highlight per shot: rules, progress, active |
| `--accent-soft` | `#fff3c2` | `#003566` | fills behind an accent (active stage, chart area)   |

Text pairs pass WCAG AA on `--bg` and `--surface` (see global.css). Accent is never the only carrier of meaning:
pair it with a label or position. The palette lives in `public/theme.css`, which the site and `player.html` both link; change it there only and
update the table above.

## Type

System font stack, same as the site (no web fonts, no network):
`system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`.

Sizes are in `cqmin` (1% of the stage's short side), so a 16:9 and a 9:16 stage read the same and the page scales
with its iframe.

| Token / class            | Size     | Weight | Use                               |
| ------------------------ | -------- | ------ | --------------------------------- |
| `--t-display` `.display` | 11cqmin  | 800    | the title shot's heading only     |
| `--t-h1` `.h1`           | 7.5cqmin | 750    | big numbers, one-line statements  |
| `--t-h2` `.h2`           | 5cqmin   | 700    | shot headings                     |
| `--t-body` `.lede`       | 3.4cqmin | 400    | taglines, captions, body          |
| `--t-label` `.label`     | 2.6cqmin | 400    | uppercase labels, tags, axis text |

Numbers that count use `font-variant-numeric: tabular-nums` so they do not jitter.

## Layout

- Stage: `.stage`, 16:9 by default, `html[data-aspect="9:16"]` for vertical. Letterboxed in any viewport, centred.
- `.shot`: fills the stage above the caption strip (bottom 12cqmin), flex column, padding `--pad` (7cqmin),
  gap `--gap` (4cqmin). Templates lay out inside it with grid or flex; use `--gap` and `--pad`, not new numbers.
- Base classes for templates: `.display .h1 .h2 .lede .label .tag .rule .card`. A template's own CSS (its `css`
  string) only arranges these; it scopes every selector under `.shot-<type>`.
- 9:16: stack what sits side by side in 16:9 (`[data-aspect='9:16'] .shot-<type> ...`).

## Screenshots

The image keeps its own ratio, centred in a frame that wears the site's screenshot look (ScreenshotGallery): `1px`
`--rule` border, `--radius` corners, `--surface` fill, no shadow. The shot's padding is tight (2cqmin, none below), so
the frame fills nearly the whole stage, whose background is `--bg` like the page. The shot's caption sits below it in
the player's muted caption strip. Callouts are a `0.5cqmin` `--accent` outline with `--radius`, plus a `.tag`
label filled with `--accent` (text `--bg`); they arrive one after another with `enter`/`easeEnter` and stay.
The move is slow and linear over the whole shot: scale at most 1.25 and shift at most 10% (default 1.00 to 1.06).

## Motion

| `kit.motion` key | Value          | Use                                                   |
| ---------------- | -------------- | ----------------------------------------------------- |
| `enter`          | 0.6 s          | an element arriving                                   |
| `move`           | 0.9 s          | a rule drawing, a camera or element travelling        |
| `stagger`        | 0.08 s         | between siblings arriving                             |
| `fade`           | 0.3 s          | shot cross-fade (the player does this, not templates) |
| `easeEnter`      | `power3.out`   | arrivals                                              |
| `easeMove`       | `power2.inOut` | travel, drawing                                       |
| `easeCount`      | `power2.out`   | counters                                              |

Rules: things arrive by rising from a mask or a short `yPercent` (25-110) with opacity, never by spinning or
bouncing. One idea per shot; its entrance is done within about the first 60% of `duration_ms`, the rest holds so
it can be read. No looping motion. Only transforms and opacity animate (no layout properties). Units in tweens:
`yPercent` / `xPercent` / `scale`, not `cqmin` (GSAP does not convert container units).

## Aspect ratios and render sizes

| `spec.aspect` | Stage | Render viewport | Use                        |
| ------------- | ----- | --------------- | -------------------------- |
| `16:9`        | 16:9  | 1280x720        | the site embed (default)   |
| `9:16`        | 9:16  | 720x1280        | phone-first / social clips |

## Libraries (pinned, cdnjs only)

- GSAP 3.15.1: `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.15.1/gsap.min.js`,
  `integrity="sha512-VMHB/Dy1/3d+djJPdMhxbplbZgbfPNHy+yWCxB1MSrwUEcNE+gnviL/DwlGsh9wwobnRTiQc6ChK2ZoJamshXA=="`
  (cdnjs SRI, checked against the downloaded file). Loaded by every demo, in `player.html`.
- Three.js 0.187.0 (ES module): `https://cdnjs.cloudflare.com/ajax/libs/three.js/0.187.0/three.module.min.js`,
  loaded by `player.js` with `import()` only when a shot's template declares `needs: ["three"]`.
