// smartQuotes (src/site/bullets.ts): curly apostrophes and double quotes for display.
import assert from "node:assert/strict";
import { test } from "node:test";
import { bulletsFor, smartQuotes } from "../../src/site/bullets.ts";

test("apostrophe inside a word becomes curly", () => {
  assert.equal(smartQuotes("Kareem's pipeline"), "Kareem’s pipeline");
});

test("a quoted phrase gets opening and closing quotes", () => {
  assert.equal(smartQuotes('flags such as "high pickup" and more'), "flags such as “high pickup” and more");
});

test("text without quotes is unchanged", () => {
  assert.equal(smartQuotes("Runs in 17 stages"), "Runs in 17 stages");
});

test("cv: [] shows a bullet in no PDF but keeps it for the site", () => {
  const items = ["both", { text: "sda only", cv: ["sda"] }, { text: "site only", cv: [] }];
  assert.deepEqual(bulletsFor(items), ["both", "sda only", "site only"]);
  assert.deepEqual(bulletsFor(items, "sda"), ["both", "sda only"]);
  assert.deepEqual(bulletsFor(items, "rpm"), ["both"]);
});
