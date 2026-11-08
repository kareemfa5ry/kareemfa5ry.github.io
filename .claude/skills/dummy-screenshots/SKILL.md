---
name: dummy-screenshots
description: >-
  Turn Kareem's real dashboard screenshots (Power BI, Excel, Tableau, any report) into publishable ones by
  repainting every number with a dummy value that still adds up, in the original font, colour and place, and
  adding a "Dummy numbers" label. Use whenever Kareem or Ramy share screenshots with real or confidential
  figures for the website, ask to hide, mask, anonymise, fake or change the numbers on a screenshot, or want
  "the same as the Power BI screenshots" for another project, even if they never say "skill".
---

# Dummy-number screenshots

Settled with Kareem on the Power BI project (PR 35). Do not ask these again, just do them:

| Question                    | Answer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Generate look-alike images? | **No.** He rejected generated replicas. Always paint on his original screenshots.                                                                                                                                                                                                                                                                                                                                                                                                                |
| What changes?               | **Numbers, and identifying names.** Numbers: KPI values, deltas, percentages, table cells, data labels, totals, and bars whose length shows a number. Names become numbered placeholders (below). Logos, brand names, background photos, field headers, slicer text, dates and axis ticks stay. Line and sparkline shapes stay too.                                                                                                                                                              |
| How fake?                   | Each base number × random 0.70–1.30, then every total, share, ratio and change recomputed from it, so the screenshots agree with each other within display rounding. Same format as shown ($1.2M stays one decimal and M).                                                                                                                                                                                                                                                                       |
| The label                   | Exactly `Dummy numbers — figures are illustrative, not real data.`: quote style (dark rounded box, gold bar on the left, italic Segoe UI) at the bottom left, moved (`--label-at`) wherever it would cover data.                                                                                                                                                                                                                                                                                 |
| Placeholder names           | Category values become `<Dimension> N`: `Source 1`, `Country 1`, `Currency 1`, `Agent 1`, `Route 1`, `Sector 1`, numbered by rank (largest first) and the same everywhere (Egypt is Country 1 on every screenshot). KPI names become `KPI-N`, the measures under KPI N become `KPI-N_SUP-M`, and a chart legend or table header naming a KPI's measure uses that KPI's name. `(Blank)` and values that reveal nothing (OW / RT) stay. A name cut in half by a panel edge is erased, not renamed. |
| Originals                   | Confidential. Only in the session scratchpad, never in the repo, deleted once the commit is pushed. Drop a stray original found in `src/assets/` from the commit and tell him.                                                                                                                                                                                                                                                                                                                   |
| Output                      | PNG, 1800 px wide (Astro serves ~200 kB WebP). Same file names as the images they replace.                                                                                                                                                                                                                                                                                                                                                                                                       |
| Alt text and captions       | Rewritten with the new numbers, and they say "dummy numbers".                                                                                                                                                                                                                                                                                                                                                                                                                                    |

Before any file change, the repo question from memory still applies (public site vs knowledge_base) unless he
already named the repo.

## Steps

Work in `<scratchpad>/shots/`: `originals/` (his files), `final/`, `sheets/`. Scripts are in `scripts/` next to
this file. Run them with `python -E -s` (they import `numfmt.py` from their own folder; `-I` would break that).
Needs `numpy pillow opencv-python` and the Segoe UI fonts in `C:/Windows/Fonts`.

1. **Inventory every number and name → `numbers.json`.** Windows OCR finds most of them
   (`Windows.Media.Ocr` from Windows PowerShell; invert dark themes and upscale 2.5× first) but misreads digits, so
   take boxes from OCR and check every text by eye. Labels over a photo: find the box by the label's colour. View each original at full resolution in crops (whole images
   are downscaled when you view them). For every number write an entry with a rough `bbox` around its ink in
   original pixels. Then run `measure.py originals numbers.json` to tighten the boxes and fill in `fg` / `bg`. Do
   not miss any: a single real number left over defeats the point. Count them per visual against the screenshot.
2. **Write `relations.json`**: how the numbers depend on each other (below). Every derived number is the
   `parent` of exactly one relation.
3. **`gen_dummy.py numbers.json relations.json dummy.json [seed]`**, then **`check_dummy.py dummy.json
relations.json`**. It must print all relations holding. Fix relations, not the checker.
4. **`paint.py originals numbers.json dummy.json final [--label-at NAME=0.30,0.97]`** (`-` for dummy.json when
   only labels change; `--no-label` when the images already carry the dummy-numbers label), then read each
   `final/*.log.txt`. An `err` above ~0.15 means a poor font fit: check that number closely.
5. **Review by eye.** `sheet.py originals final numbers.json dummy.json sheets` gives before/after crops of every
   changed number. View every sheet and every final image whole. Look for leftover old digits, halos, wrong
   weight or colour, clipped underlines, arrows that did not move, bars that disagree with their labels, and a
   label covering data. Fix with an `"erase"` entry, a better bbox, or `"align"`, then repaint from the
   originals (painting is never incremental).
6. **Hand off in the repo**: copy `final/*.png` over the images in `src/assets/projects/<slug>/`, update `alt`
   and `caption` in `src/content/projects/<slug>.md`, run `npm run check` and `npm run build` (on Node ≥ 22.23.4;
   with fnm in PowerShell, `fnm env --shell power-shell | Out-String | Invoke-Expression; fnm use v22.23.4`),
   commit only those files, push, then delete `originals/`.

## numbers.json

`{ "<image file name>": [entry, ...] }`. Entry kinds:

- **number** (default): `id` (unique across all images, e.g. `01-007-tile`), `text` exactly as shown, `bbox`
  `[x0, y0, x1, y1]` of the ink, `fg`, `bg` (`"#rrggbb"` or `"nonflat"`), `align` (`left` / `right` /
  `center`: how the visual anchors it; table cells are usually `right`, KPI cards `center`). Optional:
  `italic: true`, `arrow: true` (a trend icon right after the number moves with it), and `keep: true` (stays
  as shown but can still feed relations, e.g. a figure you choose not to change).
- **bar**: `id`, `kind: "bar"`, `bbox` of the bar including its outline, `fill` (bar colour), `value_of` (id
  of the number it draws). The bar is stretched or cut in its middle to the new / old ratio.
- **label**: `id`, `kind: "label"`, `text` exactly as shown, `new` (the placeholder), `bbox`, `align`, and like a
  number `fg` / `bg` (`measure.py` fills them). Optional: `fonts` (candidate font files, e.g. `["segoeuib"]`): pin
  one font for a whole visual, or rows come out in mixed weights. `full` + `clip` `[x0, x1]` for a name partly
  hidden behind a panel: `text` is the visible tail, `full` the whole old name, and the new name is placed where
  the whole old name was centred and drawn only inside `clip`.
- **erase**: `kind: "erase"`, `bbox`: a speck to inpaint after painting.

## relations.json

```json
{
  "relations": [
    {
      "parent": "01-001-KPI",
      "op": "sum",
      "children": ["01-013-tile", "01-014-tile", "01-018-tile"],
      "signs": [1, 1, -1]
    },
    { "parent": "01-020-share", "op": "share", "children": ["01-013-tile", "01-001-KPI"] },
    { "parent": "01-006-KPI", "op": "delta_pct", "children": ["01-001-KPI", "hidden:rev_ly"] },
    {
      "parent": "hidden:other_rows",
      "op": "sum",
      "children": ["04-062-total", "04-010", "04-011"],
      "signs": [1, -1, -1]
    }
  ],
  "hidden": { "rev_ly": 80.2e6, "other_rows": 0 },
  "descending": [["04-010", "04-011", "04-012"]]
}
```

- `op`: `sum` (optional `signs`), `delta` (a − b), `share` (a / b × 100), `ratio` (a / b), `delta_pct`
  ((a − b) / b × 100).
- `hidden:<name>` is a number the screenshot implies but doesn't show: last year's value behind a "vs LY" figure,
  rows scrolled out of a table, a blank category. Declare every one in `hidden` with its estimated real value
  (used only when it is a base number).
- The same total shown twice (the map total and the decomposition-tree root) must be **one** id's parent. Tie the
  second breakdown to it with a hidden remainder, as `other_rows` does above, instead of a second relation with
  the same parent.
- The same number on two screenshots (01 and 02 share cards): give the copy a `sum` relation with the first as
  its only child.
- `descending`: base numbers in a sorted list (bar list, sorted table). They stay in order after the shuffle.
- A hidden remainder below zero means the shown rows outgrew their total: `check_dummy.py` fails on it, so
  change the seed or widen the total's base numbers.
