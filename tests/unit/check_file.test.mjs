// Runs the PostToolUse hook (scripts/check_file.mjs) on temp files. Before scripts/check_file.mjs existed every
// case here failed: node could not find the script.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";

const DIR = "src/.check_file_test";
mkdirSync(DIR, { recursive: true });
after(() => rmSync(DIR, { recursive: true, force: true }));

function hook(path, content) {
  writeFileSync(path, content);
  const input = JSON.stringify({ tool_name: "Write", tool_input: { file_path: path } });
  return spawnSync("node", ["scripts/check_file.mjs"], { input, encoding: "utf8" });
}

test("a file over 400 lines is reported", () => {
  const run = hook(`${DIR}/long.mjs`, "export const a = 1;\n".repeat(401));
  assert.equal(run.status, 2);
  assert.match(run.stderr, /^fable-code: .*401 lines, over the 400-line cap/m);
});

test("a lint-silencing comment is reported", () => {
  const run = hook(`${DIR}/silenced.mjs`, "// eslint-disable-next-line no-console\nconsole.log(1);\n");
  assert.equal(run.status, 2);
  assert.match(run.stderr, /^fable-code: .*lint silencing comment/m);
});

test("a clean file passes silently", () => {
  const run = hook(`${DIR}/clean.mjs`, "export const a = 1;\n");
  assert.equal(run.status, 0);
  assert.equal(run.stderr, "");
});

test("a file outside the roots is ignored", () => {
  const run = hook(join(mkdtempSync(join(tmpdir(), "cf-")), "long.mjs"), "export const a = 1;\n".repeat(401));
  assert.equal(run.status, 0);
});

test("a file inside an agent worktree is checked against that worktree", () => {
  const root = join(mkdtempSync(join(tmpdir(), "cf-")), ".claude", "worktrees", "x");
  mkdirSync(join(root, "src"), { recursive: true });
  writeFileSync(join(root, "package.json"), "{}");
  const run = hook(join(root, "src", "bad.mjs"), "// eslint-disable-next-line no-console\nexport const a = 1;\n");
  assert.equal(run.status, 2);
  assert.match(run.stderr, /^fable-code: src\/bad\.mjs: lint silencing comment/m);
});

test("a missing eslint binary is named, not reported as a format error", () => {
  const root = mkdtempSync(join(tmpdir(), "cf-"));
  mkdirSync(join(root, "scripts"));
  mkdirSync(join(root, "src"));
  writeFileSync(join(root, "package.json"), "{}");
  for (const f of ["check_file.mjs", "check_layout.mjs"]) copyFileSync(join("scripts", f), join(root, "scripts", f));
  writeFileSync(join(root, "src", "a.mjs"), "export const a = 1;\n");
  const input = JSON.stringify({ tool_name: "Write", tool_input: { file_path: join(root, "src", "a.mjs") } });
  const run = spawnSync("node", [join(root, "scripts", "check_file.mjs")], { input, encoding: "utf8" });
  assert.equal(run.status, 2);
  assert.match(run.stderr, /^fable-code: eslint not found: run npm install in .+\n$/);
});
