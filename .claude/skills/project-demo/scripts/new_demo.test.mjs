// node --test .claude/skills/project-demo/scripts/new_demo.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import vm from "node:vm";
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

test("the chart counter counts from the first value to the last, formatted with the unit", () => {
  const el = () => ({ appendChild: (n) => n, setAttribute() {}, textContent: "" });
  const sandbox = { DEMO_SHOTS: {}, document: { createElementNS: el }, Intl, Math, Number, Object };
  vm.runInNewContext(loadTemplate("chart").source, sandbox);
  const chart = sandbox.DEMO_SHOTS.chart;
  const nodes = [];
  const kit = {
    motion: { move: 1, enter: 1, stagger: 0 },
    aspect: "16:9",
    dur: 4000,
    el: () => (nodes.push(el()), nodes.at(-1)),
  };
  const calls = [];
  const tl = { from() {}, fromTo: (...a) => calls.push(a) };
  const p = { kind: "line", unit: "%", x_labels: ["a", "b", "c"], series: [{ label: "s", values: [66, 20, 0.8] }] };
  chart.build(tl, p, el(), kit);
  const num = nodes[1];
  assert.equal(num.textContent, "66%");
  const [target, from, to] = calls.find(([t]) => t.v !== undefined);
  assert.deepEqual([from.v, to.v], [66, 0.8]);
  target.v = 0.8;
  to.onUpdate();
  assert.equal(num.textContent, "0.8%");
});
