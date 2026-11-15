// splitNumber (src/components/metrics/count_up.ts): prefix, number, decimals, separators and suffix of a value.
import assert from "node:assert/strict";
import { test } from "node:test";
import { initCountUp, splitNumber } from "../../src/components/metrics/count_up.ts";

const p = (prefix, number, decimals, separators, suffix) => ({ prefix, number, decimals, separators, suffix });

test("splits every value format on the site", () => {
  assert.deepEqual(splitNumber("68M"), p("", 68, 0, false, "M"));
  assert.deepEqual(splitNumber("USD 1.5M"), p("USD ", 1.5, 1, false, "M"));
  assert.deepEqual(splitNumber("~660×"), p("~", 660, 0, false, "×"));
  assert.deepEqual(splitNumber("1,305"), p("", 1305, 0, true, ""));
  assert.deepEqual(splitNumber("~9 min"), p("~", 9, 0, false, " min"));
  assert.deepEqual(splitNumber("90 days"), p("", 90, 0, false, " days"));
  assert.deepEqual(splitNumber("+37%"), p("+", 37, 0, false, "%"));
  assert.deepEqual(splitNumber("3"), p("", 3, 0, false, ""));
});

test("a value without a digit stays static", () => {
  assert.equal(splitNumber("n/a"), null);
});

test("calling initCountUp twice observes each element once", () => {
  const els = [{}, {}];
  const observed = [];
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.IntersectionObserver = class {
    observe(el) {
      observed.push(el);
    }
  };
  globalThis.document = { querySelectorAll: () => els };
  initCountUp();
  initCountUp();
  assert.deepEqual(observed, els);
});
