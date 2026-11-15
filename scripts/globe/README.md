# scripts/globe

Build step for the hero globe.

- `make_land_mask.mjs`: downloads the Natural Earth 50m land polygons (public domain), draws them as a 1024x512
  equirectangular SVG (white land, black sea) and rasterises it with `sharp` into `public/globe/land.png`.
  The hero globe samples that PNG to decide which dots are land.

Run it only when the mask needs to change (the PNG is committed):

```
node scripts/globe/make_land_mask.mjs
```
