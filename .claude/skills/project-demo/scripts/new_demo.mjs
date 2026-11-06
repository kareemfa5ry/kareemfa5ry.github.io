// Scaffold one demo: node new_demo.mjs <slug>  (or scripts/new-demo.sh <slug>). Reads public/demos/<slug>/spec.json,
// validates it against references/spec.schema.json and each shot's params against its template, fills defaults,
// and writes public/demos/<slug>/index.html: the player shell with the spec, the shot templates the spec uses and the
// player inlined. Fails (exit 1, nothing written) on an invalid spec or a page over the byte budget.
// Plain Node (no shell tricks), so it runs the same on macOS, Linux and Windows.
import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { format, resolveConfig } from "prettier";
import { applyDefaults, checkSchema } from "./check_schema.mjs";

const SKILL_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");
export const REPO_ROOT = join(SKILL_DIR, "..", "..", "..");
const TEMPLATES_DIR = join(SKILL_DIR, "assets", "templates");
const SHOTS_DIR = join(TEMPLATES_DIR, "shots");
const SCHEMA_PATH = join(SKILL_DIR, "references", "spec.schema.json");
export const SLUG_PATTERN = /^[a-z0-9_][a-z0-9_-]*$/;
// Per-demo page budget, CDN libraries excluded (they are not in the file).
const BUDGET_BYTES = 300 * 1024;

export class SpecError extends Error {}

export function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    throw new SpecError(`cannot read ${relative(REPO_ROOT, path)}: ${error.message}`);
  }
}

function availableTypes() {
  return readdirSync(SHOTS_DIR)
    .filter((name) => name.endsWith(".js"))
    .map((name) => name.slice(0, -3));
}

// Runs the template file in a sandbox that only has DEMO_SHOTS, to read its params schema and min_ms.
export function loadTemplate(type) {
  const path = join(SHOTS_DIR, `${type}.js`);
  if (!existsSync(path)) throw new SpecError(`no template '${type}'; available: ${availableTypes().join(", ")}`);
  const source = readFileSync(path, "utf8");
  const sandbox = { DEMO_SHOTS: {} };
  vm.runInNewContext(source, sandbox, { filename: path });
  const def = sandbox.DEMO_SHOTS[type];
  if (!def || typeof def.build !== "function") throw new SpecError(`${type}.js must set DEMO_SHOTS.${type}.build`);
  return { source, def };
}

export function checkShot(shot, i, def) {
  const at = `spec.shots[${i}]`;
  const errors = checkSchema(shot.params, def.params, `${at}.params`);
  if (!errors.length && def.validate) {
    errors.push(...def.validate(applyDefaults(shot.params, def.params), `${at}.params`));
  }
  if (shot.duration_ms < (def.min_ms || 0)) errors.push(`${at}.duration_ms: '${shot.type}' needs >= ${def.min_ms}`);
  return errors;
}

function resolveSpec(raw) {
  const schema = readJson(SCHEMA_PATH);
  const specErrors = checkSchema(raw, schema);
  if (specErrors.length) throw new SpecError(specErrors.join("\n"));
  const spec = applyDefaults(raw, schema);
  const templates = new Map(spec.shots.map((shot) => [shot.type, null]));
  for (const type of templates.keys()) templates.set(type, loadTemplate(type));
  const shotErrors = spec.shots.flatMap((shot, i) => checkShot(shot, i, templates.get(shot.type).def));
  if (shotErrors.length) throw new SpecError(shotErrors.join("\n"));
  const shots = spec.shots.map((shot) => ({
    ...shot,
    params: applyDefaults(shot.params, templates.get(shot.type).def.params),
  }));
  return { spec: { ...spec, shots }, templates };
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function inlineScript(source) {
  if (source.includes("</script")) throw new SpecError("an inlined script contains '</script'");
  return `<script>\n${source}</script>`;
}

export function renderPage(spec, templates) {
  const shell = readFileSync(join(TEMPLATES_DIR, "player.html"), "utf8");
  const specJson = JSON.stringify(spec).replace(/</g, "\\u003c");
  const slots = {
    TITLE: escapeHtml(spec.title),
    ASPECT: spec.aspect,
    spec: `<script type="application/json" id="demo-spec">${specJson}</script>`,
    shots: [...templates.values()].map(({ source }) => inlineScript(source)).join("\n"),
    player: inlineScript(readFileSync(join(TEMPLATES_DIR, "player.js"), "utf8")),
  };
  // One pass over the shell, so text inserted by one slot is never scanned for the others.
  return shell.replace(/\{\{(TITLE|ASPECT)\}\}|<!-- @(spec|shots|player) -->/g, (_, a, b) => slots[a ?? b]);
}

// The page is generated, so the scaffold formats it itself and `prettier --check` passes with no ignore entry.
export async function formatPage(page, file) {
  return format(page, { ...(await resolveConfig(file)), filepath: file });
}

async function main(slug) {
  if (!slug || !SLUG_PATTERN.test(slug)) throw new SpecError("usage: new-demo.sh <slug>  (lowercase, digits, - or _)");
  const demoDir = join(REPO_ROOT, "public", "demos", slug);
  const { spec, templates } = resolveSpec(readJson(join(demoDir, "spec.json")));
  const out = join(demoDir, "index.html");
  const page = await formatPage(renderPage(spec, templates), out);
  const bytes = Buffer.byteLength(page);
  if (bytes > BUDGET_BYTES) throw new SpecError(`index.html is ${bytes} bytes, over the ${BUDGET_BYTES} budget`);
  writeFileSync(out, page);
  console.log(`wrote ${relative(REPO_ROOT, out)} (${(bytes / 1024).toFixed(1)} KB, ${spec.shots.length} shots)`);
}

// Other scripts import the helpers above; only run the scaffold when this file is the entry point.
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    await main(process.argv[2]);
  } catch (error) {
    if (!(error instanceof SpecError)) throw error;
    console.error(`new-demo: ${error.message}`);
    process.exit(1);
  }
}
