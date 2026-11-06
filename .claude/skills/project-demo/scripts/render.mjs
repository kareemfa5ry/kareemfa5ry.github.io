// Render one demo to video: node render.mjs <slug> [--fps 30] [--format webm|mp4] [--contact-sheet]
// Serves public/ locally, opens /demos/<slug>/?render=1 in Playwright Chromium, awaits demo.ready, steps
// t = i * 1000 / fps with demo.seek, screenshots each frame and stitches them with ffmpeg (a host tool).
// Writes demo.webm|mp4, poster.jpg (at spec.poster_ms) and, with --contact-sheet, contact.png into the demo folder.
import { spawnSync } from "node:child_process";
import { createReadStream, existsSync, mkdtempSync, rmSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize, sep } from "node:path";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";
import { REPO_ROOT, SLUG_PATTERN, SpecError, readJson } from "./new_demo.mjs";

const PUBLIC_DIR = join(REPO_ROOT, "public");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".jpg": "image/jpeg" };
const CODECS = {
  webm: ["-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "32", "-pix_fmt", "yuv420p"],
  mp4: ["-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-movflags", "+faststart"],
};
const SHEET_COLUMNS = 5;

function serve() {
  const server = createServer((req, res) => {
    let path;
    try {
      path = decodeURIComponent(new URL(req.url, "http://x").pathname);
    } catch {
      return res.writeHead(400).end();
    }
    const file = normalize(join(PUBLIC_DIR, path));
    if (file !== PUBLIC_DIR && !file.startsWith(PUBLIC_DIR + sep)) return res.writeHead(404).end();
    const target = existsSync(file) && statSync(file).isDirectory() ? join(file, "index.html") : file;
    if (!existsSync(target)) return res.writeHead(404).end();
    res.writeHead(200, { "content-type": TYPES[extname(target)] || "application/octet-stream" });
    createReadStream(target).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, "127.0.0.1", () => resolve(server)));
}

function ffmpeg(args) {
  const run = spawnSync("ffmpeg", ["-y", "-loglevel", "error", ...args], { encoding: "utf8" });
  if (run.status !== 0) throw new SpecError(`ffmpeg failed: ${run.error?.message ?? run.stderr}`);
}

// spec.poster_ms, else the metrics shot's start + 1000, else 1000.
function posterMs(spec) {
  if (spec.poster_ms !== undefined) return spec.poster_ms;
  let start = 0;
  for (const shot of spec.shots) {
    if (shot.type === "metrics") return start + 1000;
    start += shot.duration_ms;
  }
  return 1000;
}

async function capture(url, viewport, fps, poster, framesDir, posterPath) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport });
    await page.goto(url);
    await page.evaluate(() => window.demo.ready);
    const duration = await page.evaluate(() => window.demo.duration);
    const count = Math.ceil((duration * fps) / 1000);
    for (let i = 0; i < count; i++) {
      await page.evaluate((t) => window.demo.seek(t), (i * 1000) / fps);
      await page.screenshot({ path: join(framesDir, `f${String(i).padStart(5, "0")}.png`) });
    }
    await page.evaluate((t) => window.demo.seek(t), poster);
    await page.screenshot({ path: posterPath, type: "jpeg", quality: 85 });
    return count;
  } finally {
    await browser.close();
  }
}

function stitch(framesDir, fps, format, outDir, sheet, count) {
  const input = ["-framerate", String(fps), "-i", join(framesDir, "f%05d.png")];
  const outputs = { video: join(outDir, `demo.${format}`) };
  ffmpeg([...input, ...CODECS[format], outputs.video]);
  if (sheet) {
    outputs.sheet = join(outDir, "contact.png");
    ffmpeg([...input, "-vf", `fps=1,scale=320:-2,tile=${SHEET_COLUMNS}x${Math.ceil(count / fps / SHEET_COLUMNS)}`, outputs.sheet]);
  }
  return outputs;
}

async function main({ positionals: [slug], values }) {
  if (!slug || !SLUG_PATTERN.test(slug)) throw new SpecError("usage: render.mjs <slug> [--fps 30] [--format webm|mp4]");
  const fps = Number(values.fps);
  if (!(fps >= 1 && fps <= 60) || !(values.format in CODECS)) throw new SpecError("--fps is 1-60, --format webm|mp4");
  if (spawnSync("ffmpeg", ["-version"]).error) throw new SpecError("ffmpeg not found; install it (brew/apt/choco)");
  const demoDir = join(PUBLIC_DIR, "demos", slug);
  if (!existsSync(join(demoDir, "index.html"))) throw new SpecError(`no index.html in public/demos/${slug}; run new-demo`);
  const spec = readJson(join(demoDir, "spec.json"));
  const viewport = spec.aspect === "9:16" ? { width: 720, height: 1280 } : { width: 1280, height: 720 };
  const framesDir = mkdtempSync(join(tmpdir(), `render-${slug}-`));
  const server = await serve();
  try {
    const url = `http://127.0.0.1:${server.address().port}/demos/${slug}/?render=1`;
    const poster = join(demoDir, "poster.jpg");
    const count = await capture(url, viewport, fps, posterMs(spec), framesDir, poster);
    const outputs = { ...stitch(framesDir, fps, values.format, demoDir, values["contact-sheet"], count), poster };
    console.log(`${count} frames at ${fps} fps`);
    for (const path of Object.values(outputs)) console.log(`${path} (${(statSync(path).size / 1024).toFixed(1)} KB)`);
  } finally {
    server.close();
    rmSync(framesDir, { recursive: true, force: true });
  }
}

const options = {
  fps: { type: "string", default: "30" },
  format: { type: "string", default: "webm" },
  "contact-sheet": { type: "boolean", default: false },
};
try {
  await main(parseArgs({ options, allowPositionals: true }));
} catch (error) {
  if (!(error instanceof SpecError)) throw error;
  console.error(`render: ${error.message}`);
  process.exit(1);
}
