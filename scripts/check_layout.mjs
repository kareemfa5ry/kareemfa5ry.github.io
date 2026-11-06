// Layout check (fable-code rules 1, 2, 7, 10 for this repo). Walks src/, scripts/, .github/, worker/, tests/ and
// .claude/skills/project-demo/ and fails on:
//   - a source file over 400 lines
//   - a folder with more than 8 loose source files (index.ts does not count)
//   - a grab-bag basename (utils, helpers, misc, common), any extension
//   - a lint-silencing comment in src/, scripts/, worker/ or the demo skill
// Prints one `path: reason` line per violation and exits 1, or prints `layout ok`.
// Usage: node scripts/check_layout.mjs   (run from the repo root; `npm run check:layout`)
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, parse, relative } from "node:path";
import { pathToFileURL } from "node:url";

const SKILL = ".claude/skills/project-demo";
export const ROOTS = ["src", "scripts", ".github", "worker", "tests", SKILL];
export const SILENCE_ROOTS = ["src", "scripts", "worker", SKILL];
export const SOURCE_EXTENSIONS = new Set([".astro", ".ts", ".tsx", ".js", ".mjs", ".css"]);
const MAX_LINES = 400;
const MAX_LOOSE = 8;
const NOT_LOOSE = new Set(["index.ts"]);
const GRAB_BAG_NAMES = new Set(["utils", "helpers", "misc", "common"]);
// ponytail: the [-] keeps this file from matching its own pattern.
const SILENCING = /eslint[-]disable|@ts[-]ignore|@ts[-]expect-error|prettier[-]ignore/;

function listFolders(root) {
  const folders = [];
  const pending = [root];
  while (pending.length > 0) {
    const folder = pending.pop();
    const entries = readdirSync(folder, { withFileTypes: true });
    folders.push({ folder, files: entries.filter((e) => e.isFile()).map((e) => e.name) });
    entries.filter((e) => e.isDirectory()).forEach((e) => pending.push(join(folder, e.name)));
  }
  return folders;
}

function countLines(text) {
  if (text.length === 0) return 0;
  return text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
}

export function checkFile(path, scanSilencing) {
  const problems = [];
  if (GRAB_BAG_NAMES.has(parse(path).name)) problems.push("grab-bag name, name the file by the noun it owns");
  if (!SOURCE_EXTENSIONS.has(extname(path))) return problems;
  const text = readFileSync(path, "utf8");
  const lines = countLines(text);
  if (lines > MAX_LINES) problems.push(`${lines} lines, over the ${MAX_LINES}-line cap`);
  if (scanSilencing && SILENCING.test(text)) problems.push("lint silencing comment, fix the code instead");
  return problems;
}

export function looseViolation({ folder, files }) {
  const loose = files.filter((name) => SOURCE_EXTENSIONS.has(extname(name)) && !NOT_LOOSE.has(name));
  if (loose.length <= MAX_LOOSE) return "";
  return `${folder}: ${loose.length} loose source files, over ${MAX_LOOSE}; use a subfolder`;
}

function checkFolder(entry, scanSilencing) {
  const violations = [looseViolation(entry)].filter(Boolean);
  for (const name of entry.files) {
    const path = join(entry.folder, name);
    checkFile(path, scanSilencing).forEach((reason) => violations.push(`${path}: ${reason}`));
  }
  return violations;
}

function checkLayout() {
  const violations = [];
  for (const root of ROOTS) {
    const scanSilencing = SILENCE_ROOTS.includes(root);
    for (const entry of listFolders(root)) violations.push(...checkFolder(entry, scanSilencing));
  }
  return violations.map((line) => relative(".", line).split("\\").join("/"));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const violations = checkLayout();
  violations.forEach((line) => console.log(line));
  if (violations.length > 0) process.exit(1);
  console.log("layout ok");
}
