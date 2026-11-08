// node --test .claude/skills/project-demo/scripts/images.test.mjs
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import sharp from "sharp";
import { writeImages } from "./images.mjs";

async function fixture() {
  const dir = mkdtempSync(join(tmpdir(), "demo-img-"));
  const background = { r: 10, g: 80, b: 160 };
  await sharp({ create: { width: 2000, height: 1000, channels: 3, background } })
    .png()
    .toFile(join(dir, "shot.png"));
  return dir;
}

test("a PNG becomes a webp at most 1280 px wide, with its byte size reported", async () => {
  const dir = await fixture();
  const [{ file, bytes }] = await writeImages(["shot.png"], dir, join(dir, "img"));
  assert.equal(file, join(dir, "img", "shot.webp"));
  assert.equal(readFileSync(file).length, bytes);
  assert.equal((await sharp(file).metadata()).width, 1280);
});

test("a missing source names the file", async () => {
  const dir = await fixture();
  await assert.rejects(writeImages(["nope.png"], dir, join(dir, "img")), /screenshot 'nope.png' not found/);
});

test("an image that stays over the byte cap at the lowest quality is refused", async () => {
  const dir = await fixture();
  await assert.rejects(writeImages(["shot.png"], dir, join(dir, "img"), 10), /over 10/);
});
