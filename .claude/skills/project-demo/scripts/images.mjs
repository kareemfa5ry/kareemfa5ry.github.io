// Asset step of the scaffold: turns each screenshot named by a spec into <outDir>/<name>.webp (max 1280 px wide,
// quality 80, stepping down to 60 until it is <= 300 KB). Returns [{ file, bytes }].
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

export const MAX_WIDTH = 1280;
export const MAX_IMAGE_BYTES = 300 * 1024;
const QUALITIES = [80, 70, 60];

async function toWebp(source, quality) {
  return sharp(source).resize({ width: MAX_WIDTH, withoutEnlargement: true }).webp({ quality }).toBuffer();
}

/** Writes <outDir>/<name>.webp for each file name in `images`, read from srcDir. Throws Error with a clear message. */
export async function writeImages(images, srcDir, outDir, maxBytes = MAX_IMAGE_BYTES) {
  const written = [];
  for (const image of new Set(images)) {
    const source = join(srcDir, image);
    if (!existsSync(source)) throw new Error(`screenshot '${image}' not found: expected ${source}`);
    let buffer;
    for (const quality of QUALITIES) {
      buffer = await toWebp(source, quality);
      if (buffer.length <= maxBytes) break;
    }
    if (buffer.length > maxBytes) {
      throw new Error(
        `screenshot '${image}' is ${buffer.length} bytes at quality ${QUALITIES.at(-1)}, over ${maxBytes}`,
      );
    }
    mkdirSync(outDir, { recursive: true });
    const file = join(outDir, `${basename(image, extname(image))}.webp`);
    writeFileSync(file, buffer);
    written.push({ file, bytes: buffer.length });
  }
  return written;
}
