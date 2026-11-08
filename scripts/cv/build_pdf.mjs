// cv/*.tex -> PDFs. `npm run cv:pdf` runs pdflatex twice per CV (so hyperref links resolve), copies the PDFs to
// public/assets/cv/ and rewrites cv/built-from.json. The phone number comes from the git-ignored cv/phone.txt.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, delimiter, join } from "node:path";
import { fileURLToPath } from "node:url";
import { CV_FILES } from "../../src/site/cv_files.ts";
import { sha256 } from "./generate.mjs";
import { escapeTex } from "./latex.mjs";

const ROOT = fileURLToPath(new URL("../..", import.meta.url));
const CV_DIR = join(ROOT, "cv");
const OUT_DIR = join(CV_DIR, "out");
const PUBLIC_DIR = join(ROOT, "public/assets/cv");
const MAC_TEXBIN = "/Library/TeX/texbin/pdflatex";

function findPdflatex() {
  const works = (cmd) => spawnSync(cmd, ["--version"], { stdio: "ignore", shell: false }).status === 0;
  const found = ["pdflatex", MAC_TEXBIN].find(works);
  if (found) return found;
  console.error(
    "cv: pdflatex not found. Install MacTeX or BasicTeX (macOS), or MiKTeX / TeX Live (Windows, Linux),\n" +
      "make sure pdflatex is on PATH, then run npm run cv:pdf again.",
  );
  process.exit(1);
}

function readPhone() {
  const file = join(CV_DIR, "phone.txt");
  if (existsSync(file)) return escapeTex(readFileSync(file, "utf8").split(/\r?\n/)[0].trim(), "cv/phone.txt");
  console.warn("!!! cv/phone.txt is missing: building the CVs WITHOUT a phone number. Do not publish these PDFs. !!!");
  return "";
}

function build(pdflatex, base, phone) {
  const args = [
    "-interaction=nonstopmode",
    "-halt-on-error",
    `-output-directory=${OUT_DIR}`,
    `-jobname=${base}`,
    `\\def\\cvphone{${phone}}\\input{${base}}`,
  ];
  const env = { ...process.env, TEXINPUTS: `${CV_DIR}${delimiter}${process.env.TEXINPUTS ?? ""}` };
  for (let pass = 0; pass < 2; pass++) {
    const run = spawnSync(pdflatex, args, { cwd: CV_DIR, shell: false, env, encoding: "utf8" });
    if (run.status !== 0) {
      console.error((run.stdout ?? "").trimEnd().split("\n").slice(-15).join("\n"));
      throw new Error(`cv: pdflatex failed on ${base}.tex (log: cv/out/${base}.log)`);
    }
  }
  copyFileSync(join(OUT_DIR, `${base}.pdf`), join(PUBLIC_DIR, `${base}.pdf`));
}

const pdflatex = findPdflatex();
const phone = readPhone();
mkdirSync(OUT_DIR, { recursive: true });
const built = {};
for (const cv of CV_FILES) {
  const base = basename(cv.href, ".pdf");
  console.log(`cv: building ${base}`);
  build(pdflatex, base, phone);
  built[`${base}.tex`] = sha256(readFileSync(join(CV_DIR, `${base}.tex`), "utf8"));
}
writeFileSync(join(CV_DIR, "built-from.json"), `${JSON.stringify(built, null, 2)}\n`);
console.log("cv: PDFs copied to public/assets/cv/, cv/built-from.json updated");
