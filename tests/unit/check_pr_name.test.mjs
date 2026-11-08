// scripts/check_pr_name.mjs as CI and the pre-push hook run it: exit code per PR_NUMBER / PR_TITLE / PR_BRANCH.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const SCRIPT = fileURLToPath(new URL("../../scripts/check_pr_name.mjs", import.meta.url));
const BASE_ENV = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith("PR_")));

function run(env) {
  const result = spawnSync(process.execPath, [SCRIPT], { env: { ...BASE_ENV, ...env }, encoding: "utf8" });
  return { code: result.status, stderr: result.stderr };
}

const GOOD = { PR_NUMBER: "16", PR_TITLE: "16: Enforce the PR naming rule", PR_BRANCH: "feature/16-pr-name-gate" };

test("number, title and branch agree", () => {
  assert.equal(run(GOOD).code, 0);
  assert.equal(run({ ...GOOD, PR_BRANCH: "chore/16-bump-deps" }).code, 0);
});

test("title number must be the PR number", () => {
  const { code, stderr } = run({ ...GOOD, PR_TITLE: "15: Enforce the PR naming rule" });
  assert.equal(code, 1);
  assert.match(stderr, /title .*PR number 16/);
});

test("title must start with NN: and a word", () => {
  assert.equal(run({ ...GOOD, PR_TITLE: "Enforce the PR naming rule" }).code, 1);
  assert.equal(run({ ...GOOD, PR_TITLE: "16:Enforce" }).code, 1);
});

test("branch number must be the PR number, slug lowercase", () => {
  assert.equal(run({ ...GOOD, PR_BRANCH: "feature/15-pr-name-gate" }).code, 1);
  assert.equal(run({ ...GOOD, PR_BRANCH: "feature/16-PR-Name" }).code, 1);
  assert.equal(run({ ...GOOD, PR_BRANCH: "fix/16-pr-name-gate" }).code, 1);
});

test("without a PR number only the branch format counts, main and detached HEAD pass", () => {
  assert.equal(run({ PR_BRANCH: "feature/99-anything" }).code, 0);
  assert.equal(run({ PR_BRANCH: "main" }).code, 0);
  assert.equal(run({ PR_BRANCH: "" }).code, 0);
  assert.equal(run({ PR_BRANCH: "my-branch" }).code, 1);
});
