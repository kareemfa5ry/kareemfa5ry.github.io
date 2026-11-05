# Project screenshots

Drop project screenshots here so Astro can resize and compress them at build time.

- One folder per project, named exactly like the project file without `.md`: the screenshots for
  `src/content/projects/daily-revenue-pipeline.md` go in `src/assets/projects/daily-revenue-pipeline/`.
- Name each file `<nn>-<what>.png`: a two-digit number for the order, then a short hyphenated description,
  e.g. `01-forecast-dashboard.png`, `02-pipeline-stages.png`. JPG and WebP work too.
- List each file in the project's `screenshots` front matter. `alt` text is mandatory: say what the image shows
  for someone who cannot see it. The build fails without it.

```yaml
screenshots:
  - src: ../../assets/projects/daily-revenue-pipeline/01-forecast-dashboard.png
    alt: Forecast dashboard listing next week's flights, with three flagged for a price change
    caption: Flights flagged for action, 14 days ahead
```

Remove anything confidential (passenger names, ticket numbers, partner rates) before adding a screenshot.
