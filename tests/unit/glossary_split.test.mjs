// splitTerms (src/site/knowledge/glossary_split.ts): text and glossary-term parts, whole words, first hit.
import assert from "node:assert/strict";
import { test } from "node:test";
import { splitTerms } from "../../src/site/knowledge/glossary_split.ts";

const g = [
  { term: "ATPCO", meaning: "fares database" },
  { term: "Churning", meaning: "rebooking loop" },
  { term: "Booking class (RBD)", meaning: "price letter" },
];

test("splits around a term", () => {
  assert.deepEqual(splitTerms("Filed in ATPCO daily", g), [
    { text: "Filed in " },
    { term: "ATPCO", meaning: "fares database" },
    { text: " daily" },
  ]);
});

test("no match inside a longer word", () => {
  assert.deepEqual(splitTerms("ATPCOS and XATPCO", g), [{ text: "ATPCOS and XATPCO" }]);
});

test("only the first hit per term", () => {
  const parts = splitTerms("ATPCO then ATPCO", g);
  assert.equal(parts.filter((p) => "term" in p).length, 1);
});

test("acronyms are case-sensitive, other terms are not; shown text keeps the original case", () => {
  assert.deepEqual(splitTerms("atpco", g), [{ text: "atpco" }]);
  assert.deepEqual(splitTerms("churning cut", g)[0], { term: "churning", meaning: "rebooking loop" });
});

test("a parenthetical is dropped from the searched label", () => {
  assert.deepEqual(splitTerms("Booking class mix", g)[0], { term: "Booking class", meaning: "price letter" });
});

test("text without terms is one part; empty text has none", () => {
  assert.deepEqual(splitTerms("plain", g), [{ text: "plain" }]);
  assert.deepEqual(splitTerms("", g), []);
});
