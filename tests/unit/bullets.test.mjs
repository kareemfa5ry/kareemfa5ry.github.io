// smartQuotes (src/site/bullets.ts): curly apostrophes and double quotes for display.
import assert from "node:assert/strict";
import { test } from "node:test";
import { smartQuotes } from "../../src/site/bullets.ts";

test("apostrophe inside a word becomes curly", () => {
  assert.equal(smartQuotes("Kareem's pipeline"), "Kareem’s pipeline");
});

test("a quoted phrase gets opening and closing quotes", () => {
  assert.equal(smartQuotes('flags such as "high pickup" and more'), "flags such as “high pickup” and more");
});

test("text without quotes is unchanged", () => {
  assert.equal(smartQuotes("Runs in 17 stages"), "Runs in 17 stages");
});
