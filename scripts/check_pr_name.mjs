// Checks that a pull request's number, title and branch agree (AGENTS.md, "Pull requests"): branch
// `feature/NN-short-name` or `chore/NN-short-name`, title `NN: <the feature it adds>`, NN = the number GitHub gave
// the PR. Reads PR_NUMBER, PR_TITLE and PR_BRANCH from the environment. Without PR_NUMBER (the pre-push hook, where
// no PR exists yet) only the branch format is checked; `main` and a detached HEAD are skipped. Prints one line per
// problem and exits 1, or `pr name ok`.
const BRANCH = /^(?:feature|chore)\/(\d+)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TITLE = /^(\d+): \S/;
const SKIPPED_BRANCHES = new Set(["", "main"]);

function branchProblems(branch, number) {
  const match = BRANCH.exec(branch);
  if (!match) return [`branch "${branch}": expected feature/NN-short-name or chore/NN-short-name (lowercase)`];
  if (number && match[1] !== number) return [`branch "${branch}": its number must be the PR number ${number}`];
  return [];
}

function titleProblems(title, number) {
  const match = TITLE.exec(title);
  if (!match) return [`title "${title}": expected "NN: <the feature it adds>"`];
  if (match[1] !== number) return [`title "${title}": its number must be the PR number ${number}`];
  return [];
}

function prNameProblems({ number, title, branch }) {
  if (!number) return SKIPPED_BRANCHES.has(branch) ? [] : branchProblems(branch, "");
  return [...branchProblems(branch, number), ...titleProblems(title, number)];
}

const problems = prNameProblems({
  number: process.env.PR_NUMBER ?? "",
  title: process.env.PR_TITLE ?? "",
  branch: process.env.PR_BRANCH ?? "",
});
for (const problem of problems) console.error(problem);
if (problems.length > 0) process.exit(1);
console.log("pr name ok");
