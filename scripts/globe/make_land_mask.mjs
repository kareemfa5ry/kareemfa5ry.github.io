// Builds public/globe/land.png, the 1024x512 equirectangular land mask the hero globe samples (white land on
// black sea). Source: Natural Earth land polygons (public domain). Run: node scripts/globe/make_land_mask.mjs
import { mkdir, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_land.geojson";
const OUT = new URL("../../public/globe/land.png", import.meta.url);
const W = 1024;
const H = 512;

const point = ([lon, lat]) => `${(((lon + 180) / 360) * W).toFixed(1)},${(((90 - lat) / 180) * H).toFixed(1)}`;
const ring = (r) => `M${r.map(point).join("L")}Z`;
const polygonPath = (rings) => rings.map(ring).join("");

function geometryPath({ type, coordinates }) {
  if (type === "Polygon") return polygonPath(coordinates);
  if (type === "MultiPolygon") return coordinates.map(polygonPath).join("");
  return "";
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Download failed: ${response.status}`);
const { features } = await response.json();
const d = features.map((f) => geometryPath(f.geometry)).join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<rect width="${W}" height="${H}" fill="#000"/><path d="${d}" fill="#fff" fill-rule="evenodd"/></svg>`;
const png = await sharp(Buffer.from(svg)).greyscale().png({ compressionLevel: 9, palette: true }).toBuffer();
await mkdir(new URL("./", OUT), { recursive: true });
await writeFile(OUT, png);
console.log(`Wrote public/globe/land.png (${(png.length / 1024).toFixed(1)} KB)`);
