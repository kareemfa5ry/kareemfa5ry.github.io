# Shot types

A shot is one entry of `spec.shots`: `{ "type", "duration_ms", "caption", "params" }`. `type` names a file in
`assets/templates/shots/<type>.js`; `params` is checked against that template's own `params` schema and filled
with its defaults by `scripts/new_demo.mjs`, so the template is the one home of its params.

| Type           | File                    | Status | What it shows                                   |
| -------------- | ----------------------- | ------ | ----------------------------------------------- |
| `title`        | `shots/title.js`        | done   | kinetic typography: heading, tagline, stack     |
| `metrics`      | `shots/metrics.js`      | done   | 1-4 big numbers counting up, with labels        |
| `pipeline`     | `shots/pipeline.js`     | done   | stages in a row lighting up, data flowing along |
| `architecture` | `shots/architecture.js` | done   | boxes and arrows revealed in order              |
| `chart`        | `shots/chart.js`        | done   | a line or bar chart drawing, with counters      |
| `hero3d`       | `shots/hero3d.js`       | done   | a Three.js scene with a slow camera move        |
| `outro`        | `shots/outro.js`        | done   | call to action with repo / live links           |

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

## pipeline

Stages arrive, then a marker travels along them: connectors fill with the accent, reached stages sit on
`--accent-soft`. Row in 16:9, column in 9:16. `min_ms` 3500.

| Param               | Type   | Default | Meaning                      |
| ------------------- | ------ | ------- | ---------------------------- |
| `heading`           | string | `""`    | optional line above          |
| `stages` (required) | array  |         | 2 to 5 stages, in flow order |
| `stages[].label`    | string |         | stage name (required)        |
| `stages[].detail`   | string | `""`    | short line under the name    |

## architecture

Boxes on a coarse grid, revealed one by one in `order`; an arrow draws once both its ends are shown. One SVG
(160x80, or 80x160 with the grid transposed in 9:16). Labels of about 12 characters fit. `min_ms` 4000.

| Param                 | Type    | Default | Meaning                                   |
| --------------------- | ------- | ------- | ----------------------------------------- |
| `nodes` (required)    | array   |         | 2 to 8 boxes                              |
| `nodes[].id`          | string  |         | unique id (required)                      |
| `nodes[].label`       | string  |         | text in the box (required)                |
| `nodes[].x`, `.y`     | integer |         | grid column 0-4, row 0-2 (required)       |
| `edges` (required)    | array   |         | 0 to 12 arrows                            |
| `edges[].from`, `.to` | string  |         | node ids (required)                       |
| `edges[].label`       | string  | `""`    | short text on the arrow                   |
| `order`               | array   | `[]`    | node ids in reveal order; empty = `nodes` |

## chart

Inline SVG, no library. Lines draw by `stroke-dashoffset`, bars grow by `scaleY`; a counter above counts to the
last value of the first series (one decimal unless that value is whole). Series use accent, ink, muted.
`min_ms` 3500.

| Param                 | Type   | Default  | Meaning                    |
| --------------------- | ------ | -------- | -------------------------- |
| `kind`                | enum   | `"line"` | `line` or `bar` (grouped)  |
| `unit`                | string | `""`     | appended to the counter    |
| `x_labels` (required) | array  |          | 2 to 12 labels             |
| `series` (required)   | array  |          | 1 to 3 series              |
| `series[].label`      | string |          | legend tag (required)      |
| `series[].values`     | array  |          | 2 to 12 numbers (required) |

## outro

Call to action: heading, accent rule, then repo and live links as visible text URLs. Live they are real anchors
with `target="_top"`. `links` is merged over `spec.links`. `min_ms` 2500.

| Param        | Type   | Default                 | Meaning                         |
| ------------ | ------ | ----------------------- | ------------------------------- |
| `heading`    | string | `"See it for yourself"` | the call to action              |
| `links.repo` | string | spec value              | `https://` URL, shown as Source |
| `links.live` | string | spec value              | `https://` URL, shown as Live   |

## hero3d: how Three.js loads and stays deterministic

Implemented in `shots/hero3d.js`. `min_ms` 3000. Params: `shape` (`"cloud"` seeded points via `kit.rand`, or
`"knot"` wireframe torus knot; default `cloud`), `orbit_deg` (integer 0-180, camera sweep, default 60), `heading`
(optional line above, default `""`). Colours are read from `--accent` through a probe element.

- The template declares `needs: ["three"]`. At load the player collects `needs` from the templates the spec uses
  and `import()`s only those URLs from `LIBS` (Three.js 0.187.0 ES module on cdnjs). A demo without a hero3d shot
  never fetches Three.js (checked: 0 requests). `demo.ready` resolves only after the import and the build.
- `build` gets the module as `kit.lib.three`, creates the renderer once with
  `{ antialias: true, alpha: true, preserveDrawingBuffer: true }`, sized from the `.view` box at build. If WebGL
  is unavailable it warns and skips the scene.
- Never `setAnimationLoop` or `requestAnimationFrame`. A proxy `{ k: 0 }` is tweened to 1 over the shot on `tl`
  with `ease: "none"`; its `onUpdate` places the camera from `k` and renders.
- **SRI decision:** dynamic `import()` cannot carry an SRI hash and an import map would need a player/scaffold
  change, so the pinned cdnjs URL is imported without SRI (the version is exact; no other network call).
