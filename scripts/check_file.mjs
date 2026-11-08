// Claude Code PostToolUse hook for Edit|Write (wired in .claude/settings.json). Reads the hook JSON on stdin and
// checks the one edited file: eslint, prettier, the layout caps from check_layout.mjs. Advisory, never edits files.
// Prints each problem as `fable-code: ...` on stderr and exits 2 (fed back to the agent), or exits 0 silently.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { ROOTS, SILENCE_ROOTS, SOURCE_EXTENSIONS, checkFile, looseViolation } from "./check_layout.mjs";

const LINTED = new Set([".astro", ".ts", ".tsx", ".js", ".mjs"]);

// The edited file's own project (a worktree has its own package.json and config); its binaries, else this repo's.
const OWN_BINS = join(dirname(fileURLToPath(import.meta.url)), "..", "node_modules", ".bin");

function projectRoot(file) {
  let dir = dirname(file);
  while (!existsSync(join(dir, "package.json")) && dirname(dir) !== dir) dir = dirname(dir);
  return existsSync(join(dir, "package.json")) ? dir : "";
}

function bin(name, args) {
  const exe = process.platform === "win32" ? `${name}.cmd` : name;
  const local = join("node_modules", ".bin", exe);
  const path = existsSync(local) ? local : join(OWN_BINS, exe);
  // Checked before spawning: on Windows the shell turns a missing binary into exit 1, never ENOENT.
  if (!existsSync(path)) {
    console.error(`fable-code: ${name} not found: run npm install in ${process.cwd()}`);
    process.exit(2);
  }
  const run = spawnSync(path, args, { encoding: "utf8", shell: process.platform === "win32" });
  return { status: run.status, out: `${run.stdout ?? ""}${run.stderr ?? ""}` };
}

function problemsFor(rel) {
  const problems = [];
  const root = ROOTS.find((r) => rel.startsWith(`${r}/`));
  if (!root || !SOURCE_EXTENSIONS.has(extname(rel))) return problems;
  if (LINTED.has(extname(rel))) {
    const lint = bin("eslint", ["--max-warnings", "0", "--format", "unix", rel]);
    if (lint.status !== 0)
      lint.out
        .split("\n")
        .filter((l) => l.includes(rel))
        .forEach((l) => problems.push(l));
  }
  if (bin("prettier", ["--check", rel]).status !== 0)
    problems.push(`${rel}: prettier format differs, run prettier --write`);
  checkFile(rel, SILENCE_ROOTS.includes(root)).forEach((reason) => problems.push(`${rel}: ${reason}`));
  const folder = dirname(rel);
  const files = readdirSync(folder, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name);
  const loose = looseViolation({ folder, files });
  if (loose) problems.push(loose);
  return problems;
}

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const filePath = input?.tool_input?.file_path;
const rootDir = filePath ? projectRoot(resolve(String(filePath))) : "";
if (rootDir) {
  process.chdir(rootDir);
  const rel = relative(rootDir, resolve(String(filePath)))
    .split("\\")
    .join("/");
  const problems = problemsFor(rel);
  if (problems.length > 0) {
    problems.forEach((line) => console.error(`fable-code: ${line}`));
    process.exit(2);
  }
}
