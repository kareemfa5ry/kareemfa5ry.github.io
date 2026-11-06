// node --test .claude/skills/project-demo/scripts/check_schema.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { applyDefaults, checkSchema } from "./check_schema.mjs";

const schema = JSON.parse(readFileSync(new URL("../references/spec.schema.json", import.meta.url), "utf8"));
const valid = { title: "T", tagline: "L", shots: [{ type: "title", duration_ms: 3000 }] };

test("a minimal spec is valid and gets its defaults", () => {
  assert.deepEqual(checkSchema(valid, schema), []);
  const spec = applyDefaults(valid, schema);
  assert.equal(spec.aspect, "16:9");
  assert.equal(spec.seed, 1);
  assert.deepEqual(spec.shots[0].params, {});
  assert.equal(spec.shots[0].caption, "");
});

test("each broken field is named by path", () => {
  const broken = { ...valid, aspect: "4:3", extra: 1, shots: [{ type: "title", duration_ms: 3000.5 }] };
  assert.deepEqual(checkSchema(broken, schema), [
    "spec.shots[0].duration_ms: expected integer, got number",
    "spec.aspect: must be one of 16:9, 9:16",
    "spec.extra: is not allowed",
  ]);
  assert.deepEqual(checkSchema({ title: "T" }, schema), ["spec.tagline: is required", "spec.shots: is required"]);
  assert.deepEqual(checkSchema({ ...valid, shots: [] }, schema), ["spec.shots: needs 1+"]);
});

test("defaults fill nested array items without touching given values", () => {
  const params = { type: "object", properties: { items: { type: "array", items: schemaWithDefault() } } };
  assert.deepEqual(applyDefaults({ items: [{}, { n: 5 }] }, params), { items: [{ n: 0 }, { n: 5 }] });
});

function schemaWithDefault() {
  return { type: "object", properties: { n: { type: "integer", default: 0 } } };
}
