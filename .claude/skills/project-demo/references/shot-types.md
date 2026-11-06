# Shot types

A shot is one entry of `spec.shots`: `{ "type", "duration_ms", "caption", "params" }`. `type` names a file in
`assets/templates/shots/<type>.js`; `params` is checked against that template's own `params` schema and filled
with its defaults by `scripts/new_demo.mjs`, so the template is the one home of its params.

| Type           | File                    | Status      | What it shows                                   |
| -------------- | ----------------------- | ----------- | ----------------------------------------------- |
| `title`        | `shots/title.js`        | done        | kinetic typography: heading, tagline, stack     |
| `metrics`      | `shots/metrics.js`      | done        | 1-4 big numbers counting up, with labels        |
| `pipeline`     | `shots/pipeline.js`     | later phase | stages in a row lighting up, data flowing along |
| `architecture` | `shots/architecture.js` | later phase | boxes and arrows revealed in order              |
| `chart`        | `shots/chart.js`        | later phase | a line or bar chart drawing, with counters      |
| `hero3d`       | `shots/hero3d.js`       | later phase | a Three.js scene with a slow camera move        |
| `outro`        | `shots/outro.js`        | later phase | call to action with repo / live links           |

## The template contract

A template is a classic script (no `import`, no `export`) that registers one object:

```js
DEMO_SHOTS.<type> = { min_ms, params, css, needs, build(tl, p, root, kit) };
```

| Field    | Required | Meaning                                                                                    |
| -------- | -------- | ------------------------------------------------------------------------------------------ |
| `build`  | yes      | adds this shot's tweens to `tl`; see below                                                 |
| `params` | yes      | JSON Schema of `params` (`type: "object"`, `additionalProperties: false`), with `default`s |
| `min_ms` | no       | shortest `duration_ms` that fits the choreography; the scaffold rejects less               |
| `css`    | no       | one string, every selector under `.shot-<type>`; the player injects it once per type       |
| `needs`  | no       | libraries to lazy-load, keys of `LIBS` in `player.js` (today: `"three"`)                   |

`build(tl, p, root, kit)`, called once at load, before any frame:

- `tl`: a fresh GSAP timeline in **seconds**, starting at 0 = the shot's start. The player places it on the master
  at the shot's offset, fades the shot (and its caption) in and out, and warns if `tl` runs past `kit.dur`.
- `p`: the shot's params, already validated and with every default filled. Never re-check or re-default here.
- `root`: the shot's empty `<section class="shot shot-<type>">`, a flex column inside the stage. Build the DOM
  with `kit.el`, never `innerHTML` (spec strings are text).
- `kit`: `{ dur, motion, rand, el, spec, lib, aspect }`
  - `dur`: this shot's length in seconds (`duration_ms / 1000`).
  - `motion`: the motion tokens (`enter`, `move`, `stagger`, `easeEnter`, `easeMove`, `easeCount`, ...).
  - `rand()`: seeded PRNG in [0, 1), shared by all shots in spec order (mulberry32, `spec.seed`).
  - `el(tag, className, text)`: create an element, `text` set as textContent.
  - `spec`: the whole resolved spec (`title`, `tagline`, `stack`, `links`, ...) for fallbacks.
  - `lib`: loaded modules by name, e.g. `kit.lib.three` when `needs: ["three"]`.
  - `aspect`: `"16:9"` or `"9:16"` (layout differences belong in `css` under `[data-aspect='9:16']`).

Rules a template must keep (they are what makes `seek(t)` deterministic):

1. Every visual change is a tween or `set` on `tl`. No timers, no `requestAnimationFrame`, no `Date`, no
   `Math.random`, no CSS transitions or keyframes.
2. Anything not a CSS property (a counter's text, a canvas, a 3D camera) is driven by a proxy object tweened on
   `tl` plus an `onUpdate` that paints from the proxy only: `tl.to(proxy, { v: 1, onUpdate: paint })`. `paint`
   reads nothing but the proxy and constants. Call `paint()` once at build so the start frame is right.
3. Tween transforms and opacity (`yPercent`, `scaleX`, `autoAlpha`), not layout properties or `cqmin` values.
4. Use the design system's classes and `kit.motion`; no new colours, fonts or durations.
5. Entrance done in about the first 60% of `kit.dur`; set `min_ms` so the shortest allowed shot still fits.
6. Stay one concern, under 300 lines. A shared drawing piece goes in its own file only when two templates use it.

## Writing a template (for a new type)

1. Copy `shots/metrics.js` (it has nested params and a counter) to `shots/<type>.js`; rename the key.
2. Declare `params` with a `description` and a `default` for every optional field; mark the rest `required`.
   Keywords available: `type, enum, properties, required, additionalProperties, items, minItems, maxItems,
minimum, maximum, minLength, pattern, default` (`scripts/check_schema.mjs`; others are ignored).
3. Write `build`, keeping the rules above. Lay out for 16:9 first, then add the 9:16 override.
4. Add a shot of the new type to a scratch spec, run `scripts/new-demo.sh <slug>`, open it, run the QA checklist
   in `SKILL.md` (the determinism check in particular), then delete the scratch spec.
5. Update this file: the type's row in the catalog above and a params section below.

## title

Kinetic typography. Heading words rise out of a mask one by one, an accent rule draws, then tagline and stack tags.
`min_ms` 2500.

| Param        | Type    | Default | Meaning                                  |
| ------------ | ------- | ------- | ---------------------------------------- |
| `heading`    | string  | `""`    | big words; empty uses `spec.title`       |
| `tagline`    | string  | `""`    | line under it; empty uses `spec.tagline` |
| `show_stack` | boolean | `true`  | show `spec.stack` as tags                |

```json
{ "type": "title", "duration_ms": 3500, "caption": "Raw logs in, answers out." }
```

## metrics

Big-number stats. Cards rise in turn; each number counts from 0 to `value` (en-US format), an accent rule draws.
Side by side in 16:9, stacked in 9:16. `min_ms` 3000.

| Param              | Type    | Default | Meaning                       |
| ------------------ | ------- | ------- | ----------------------------- |
| `heading`          | string  | `""`    | optional line above the cards |
| `items` (required) | array   |         | 1 to 4 cards                  |
| `items[].value`    | number  |         | final number (required)       |
| `items[].label`    | string  |         | what it measures (required)   |
| `items[].prefix`   | string  | `""`    | before the number, e.g. `€`   |
| `items[].suffix`   | string  | `""`    | after it, e.g. `%`, `h`, `x`  |
| `items[].decimals` | integer | `0`     | 0 to 3 digits after the point |

```json
{
  "type": "metrics",
  "duration_ms": 4000,
  "caption": "What it recovered in the first quarter.",
  "params": { "items": [{ "value": 97.4, "label": "bags matched", "suffix": "%", "decimals": 1 }] }
}
```

## Planned types: shape agreed, params up to the phase that builds them

- **pipeline**: `stages: [{ label, detail? }]` (2-5) in a row (a column in 9:16), connectors in `--rule` that fill
  with `--accent` as a marker travels stage to stage (proxy progress + `onUpdate`), the active stage on
  `--accent-soft`.
- **architecture**: `nodes: [{ id, label, x, y }]` on a coarse grid and `edges: [{ from, to, label? }]`, revealed
  in `order` (ids); arrows as inline SVG paths drawn by tweening `stroke-dashoffset`.
- **chart**: `kind: "line" | "bar"`, `series: [{ label, values: [] }]`, `x_labels`, `unit`; inline SVG, the line
  drawn by `stroke-dashoffset`, bars by `scaleY`, a counter for the last value. No chart library.
- **outro**: `heading`, `links` defaulting to `spec.links` (repo, live) shown as text URLs (a video frame cannot be
  clicked); live, the same text is a real anchor with `target="_top"`.
- **hero3d**: see below.

## hero3d: how Three.js loads and stays deterministic

The hook exists in `player.js`; the template does not yet.

- The template declares `needs: ["three"]`. At load the player collects `needs` from the templates the spec uses
  and `import()`s only those URLs from `LIBS` (Three.js 0.187.0 ES module on cdnjs). A demo without a hero3d shot
  never fetches Three.js. `demo.ready` resolves only after the import and the build, so render.mjs never
  screenshots an empty canvas.
- `build` gets the module as `kit.lib.three`. Create the renderer once with
  `{ antialias: true, preserveDrawingBuffer: true }` (screenshots need the buffer), size it from `root`.
- Never call `renderer.setAnimationLoop` or `requestAnimationFrame`. Tween a proxy `{ k: 0 }` to `{ k: 1 }` over the
  shot on `tl` with `ease: "none"`, and in its `onUpdate` set the camera from `k` (a fixed path) and call
  `renderer.render(scene, camera)`. Geometry that looks random is placed with `kit.rand()` at build.
- Colours come from the tokens: a custom property holds the unresolved `light-dark(...)`, so give a probe element
  `color: var(--accent)` and read its computed `color` at build.
- Open: dynamic `import()` cannot carry an SRI hash. The hero3d phase decides between an import map with an
  `integrity` entry (generated only when `three` is needed) and accepting the pinned URL without SRI; note the
  choice here.
