---
name: project-demo
description: Build a code-rendered animated demo for a project on Kareem's site from a spec.json (title, tagline, stack, links, ordered shots), scaffold it into public/demos/<slug>/index.html with GSAP, play it live in an iframe and render it frame by frame to video. Use whenever Ramy or Kareem mention a project demo, an animated showcase, a walkthrough or explainer video, a hero animation, a demo reel, or adding a new project to the site, even if they never say "skill"; also when adding or changing a shot template (title, metrics, pipeline, architecture, chart, hero3d, outro).
---

# project-demo

Every project page can carry a short animation made from code, not a screen recording. You write a **spec**
(data only); the scaffold inlines the **player** and the **shot templates** the spec uses into one
self-contained `public/demos/<slug>/index.html`. The same page plays live on the site (in an iframe) and renders
to video, because every frame is a pure function of one number: the time `t` in milliseconds.

## Files

| Path                               | Owns                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------- |
| `SKILL.md`                         | this workflow, the contract, the QA checklist                                                     |
| `references/design-system.md`      | tokens, type scale, layout units, motion rules, aspect ratios                                     |
| `references/shot-types.md`         | every shot type and its params; how to write a new template                                       |
| `references/spec.schema.json`      | the spec format (JSON Schema 2020-12, the subset `check_schema.mjs` enforces)                     |
| `assets/templates/player.html`     | page shell: tokens, base classes, stage, captions, button, progress, GSAP tag                     |
| `assets/templates/player.js`       | runtime: master timeline, `window.demo`, autoplay, controls, PRNG, lib loader                     |
| `assets/templates/shots/<type>.js` | one shot template each (title, metrics, pipeline, architecture, chart, hero3d, screenshot, outro) |
| `scripts/new-demo.sh`              | thin wrapper: `exec node new_demo.mjs "$@"`                                                       |
| `scripts/new_demo.mjs`             | the scaffold: validate, fill defaults, inline, check the byte budget, write                       |
| `scripts/images.mjs`               | screenshot step: source PNG to `public/demos/<slug>/img/<name>.webp` (1280 px, <= 300 KB each)    |
| `assets/templates/images-ready.js` | inlined only with screenshot shots: `demo.ready` also waits for every image to decode             |
| `scripts/render.mjs`               | the renderer: frames via Playwright, ffmpeg to video, poster, contact sheet                       |
| `scripts/check_schema.mjs`         | the hand-written JSON Schema checker and default filler (no ajv)                                  |
| `scripts/check_schema.test.mjs`    | its tests: `node --test .claude/skills/project-demo/scripts/check_schema.test.mjs`                |

Shot templates live in `assets/templates/shots/` (8 loose files at most: all eight types fit, the cap), so the
player pair stays apart from them; `new_demo.mjs` finds a type by its file name there.

## Workflow: add a demo for a project

1. Pick the slug: the project's content file name (`src/content/projects/<slug>.md`). Read that file for the
   numbers and the story; never invent a metric.
2. Write `public/demos/<slug>/spec.json` (schema: `references/spec.schema.json`, add
   `"$schema": "../../../.claude/skills/project-demo/references/spec.schema.json"` for editor hints). Shots in
   order; each has `type`, `duration_ms`, `caption` (real text, one sentence) and `params` (see shot-types.md).
3. Scaffold: `.claude/skills/project-demo/scripts/new-demo.sh <slug>`
   (Windows: `node .claude/skills/project-demo/scripts/new_demo.mjs <slug>`). The output is prettier-formatted
   (commit it as generated, never hand-edit it). It exits 1 and writes nothing if
   the spec is invalid (every problem is listed by path) or the page is over 300 KB.
4. Look at it: open `public/demos/<slug>/index.html` in a browser (file:// works), also with `?theme=dark`,
   `?theme=light` and `?render=1`, then run the QA checklist below.
5. Commit `spec.json` and `index.html` (and `poster.jpg` once render.mjs exists). Videos, contact sheets and
   frames are git-ignored.

Regenerate after any template or player change: `index.html` is build output; never edit it by hand.

## The determinism contract

The page exposes, once loaded:

```js
window.demo = { duration, ready, seek(tMs), play(), pause() };
```

- `duration`: total ms (sum of `duration_ms`). `ready`: a Promise; await it before the first `seek` (it resolves
  after lazy libraries load and the timeline is built).
- One GSAP master timeline, created `paused: true`. Each shot template adds its own child timeline at its offset.
  `seek(t)` moves the playhead and fires tween `onUpdate`s, so the same `t` gives the same DOM, whatever the
  previous `t` (checked forward, backward and on a fresh load).
- Templates never use `setTimeout`, `setInterval`, `requestAnimationFrame`, `Date`, `performance.now`, CSS
  transitions or animations, or `Math.random`. Randomness comes from `kit.rand()` (mulberry32 seeded by
  `spec.seed`). Numbers are formatted with a fixed locale (`en-US`).

## URL parameters and modes

| Input                            | Effect                                                                                    |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| `?theme=light` / `?theme=dark`   | pins `html[data-theme]` before first paint, same tokens as the site                       |
| no `theme`                       | follows `prefers-color-scheme` (`color-scheme: light dark`)                               |
| `?render=1`                      | no autoplay, no controls or progress bar, no CSS transitions; only `demo.seek` moves time |
| `prefers-reduced-motion: reduce` | (live only) opens on the final frame, no autoplay; Replay plays on request                |
| `spec.aspect: "9:16"`            | vertical stage (`html[data-aspect]`), letterboxed in any viewport                         |

Live mode: autoplays once when at least half the stage is on screen (IntersectionObserver; inside the site's
iframe it tracks the page viewport), pauses when scrolled away, one button cycles Play / Pause / Replay (44 px
minimum target, focus ring). A visitor's Pause sticks: scrolling back does not restart it.

## Site embed (later phase, settled)

`src/components/projects/Demo.astro` renders
`<iframe src="/demos/<slug>/?theme=<html[data-theme]>" loading="lazy">` with the poster and a caption, included
by the project page when `public/demos/<slug>/spec.json` exists. The site stores the visitor's theme in
`localStorage["theme"]` and on `html[data-theme]` (`src/site/theme.ts`); pass that value as `?theme=`.

## Video

`node .claude/skills/project-demo/scripts/render.mjs <slug> [--fps 30] [--format webm|mp4] [--contact-sheet]`
opens `index.html?render=1` (served from `public/` on a free local port) in Playwright Chromium, awaits
`demo.ready`, steps `t = i * 1000 / fps` with `demo.seek(t)`, screenshots each frame to the OS temp folder and
stitches with ffmpeg (a host tool; the script exits 1 and says so if it is missing, or if the slug has no
`index.html`). Viewport: 1280x720, or 720x1280 for 9:16.

- `demo.webm` (VP9) or `demo.mp4` (H.264, yuv420p, faststart), `contact.png` (one frame per second, 5 per row,
  with `--contact-sheet`) and `poster.jpg` (quality 85) land in `public/demos/<slug>/`; it prints each path and size.
- Poster frame: `spec.poster_ms`, else the metrics shot's start + 1000 ms, else 1000 ms. Commit `poster.jpg`;
  the video and contact sheet are git-ignored.
- In CI: Actions > "Render demo" > Run workflow (inputs `slug`, `format`). It renders with `--contact-sheet` and
  uploads the files as the artifact `demo-<slug>` (14 days). It commits nothing.

## QA checklist (before committing a demo)

- [ ] `new-demo.sh <slug>` passes; the printed size is under 300 KB.
- [ ] Every number on screen is in the project's content file; captions are full sentences.
- [ ] Light and dark both readable (`?theme=light`, `?theme=dark`); no colour outside the tokens.
- [ ] `?render=1`: `seek(t)` twice at a few times (and after seeking elsewhere) returns identical
      `document.querySelector(".stage").innerHTML`; no console errors.
- [ ] Live: autoplays when scrolled in, Pause / Play / Replay work by mouse and keyboard.
- [ ] Reduced motion (DevTools > Rendering > emulate) shows the final frame, nothing moves until Replay.
- [ ] Each shot finishes its entrance well before its `duration_ms` (the console warns if a template overruns).
- [ ] `render.mjs <slug> --contact-sheet` succeeds; look at `contact.png` (nothing clipped, text readable, no blank
      frames) and at `poster.jpg`.
- [ ] 9:16 specs: nothing clipped at a 360 px wide viewport.

## Changing the system

- New shot type: follow "Writing a template" in `references/shot-types.md`, then add its row there and in the
  Files table above.
- New token, size or easing: change `player.html` / the `MOTION` object in `player.js` and
  `references/design-system.md` together; colour tokens only ever mirror `src/styles/global.css`.
- New CDN library: pin an exact version on cdnjs, add it to `LIBS` in `player.js` (ES module URL) or as a
  `<script>` with its SRI hash in `player.html`, and name it in design-system.md. No other network calls.
