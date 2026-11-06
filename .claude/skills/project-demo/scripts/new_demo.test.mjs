// node --test .claude/skills/project-demo/scripts/new_demo.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { checkShot, loadTemplate, renderPage } from "./new_demo.mjs";

const { def } = loadTemplate("architecture");
const node = (id) => ({ id, label: id, x: 0, y: 0 });
const arch = (params) => [...checkShot({ type: "architecture", duration_ms: 5000, params }, 2, def)]; // copy: the template ran in a vm, its arrays belong to another realm
const base = { nodes: [node("a"), node("b")], edges: [{ from: "a", to: "b" }] };

test("a consistent architecture shot is valid", () => {
  assert.deepEqual(arch({ ...base, order: ["b", "a"] }), []);
});

test("an edge naming a missing node is reported by path", () => {
  assert.deepEqual(arch({ ...base, edges: [{ from: "a", to: "zz" }] }), [
    "spec.shots[2].params.edges[0].to: no node 'zz'",
  ]);
});

test("an order entry naming a missing node is reported", () => {
  assert.deepEqual(arch({ ...base, order: ["a", "q"] }), ["spec.shots[2].params.order[1]: no node 'q'"]);
});

test("a duplicate node id is reported", () => {
  assert.deepEqual(arch({ nodes: [node("a"), node("a")], edges: [{ from: "a", to: "a" }] }), [
    "spec.shots[2].params.nodes[1].id: 'a' is used twice",
  ]);
});

test("slot text inside the spec is not substituted again", () => {
  const page = renderPage({ title: "{{ASPECT}}", aspect: "16:9", shots: [] }, new Map());
  assert.ok(page.includes("<title>{{ASPECT}}</title>"));
});
