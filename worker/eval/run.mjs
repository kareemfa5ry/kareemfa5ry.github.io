// Local recruiter-style eval of the chat prompt: one live Claude call per case in questions.json.
// Never runs in CI. Key: ANTHROPIC_API_KEY from the shell, else worker/.dev.vars. Run: npm run worker:eval
import { readFileSync } from "node:fs";
import { buildSystemPrompt } from "../src/prompt.ts";
import { CHAT_MODEL, MAX_ANSWER_TOKENS } from "../src/claude_stream.ts";

const SITE = "https://kareemfa5ry.github.io";
const here = (name) => new URL(name, import.meta.url);

function loadKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  const line = readFileSync(here("../.dev.vars"), "utf8")
    .split("\n")
    .find((l) => l.startsWith("ANTHROPIC_API_KEY="));
  if (!line) throw new Error("ANTHROPIC_API_KEY is not set in the shell or worker/.dev.vars");
  return line.slice("ANTHROPIC_API_KEY=".length).trim();
}

async function ask(key, system, question) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: CHAT_MODEL,
      max_tokens: MAX_ANSWER_TOKENS,
      output_config: { effort: "low" }, // same as the worker, else thinking eats the token budget
      system,
      messages: [{ role: "user", content: question }],
    }),
  });
  if (!res.ok) throw new Error(`Messages API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  return body.content.map((block) => block.text ?? "").join("");
}

function grade(testCase, reply) {
  const misses = testCase.must.filter((p) => !new RegExp(p, "i").test(reply)).map((p) => `missing /${p}/`);
  const hits = testCase.must_not.filter((p) => new RegExp(p, "i").test(reply)).map((p) => `forbidden /${p}/`);
  return [...misses, ...hits];
}

const key = loadKey();
const cases = JSON.parse(readFileSync(here("questions.json"), "utf8"));
const knowledge = await (await fetch(`${SITE}/llms.txt`)).text();
const system = buildSystemPrompt(knowledge);
let passed = 0;
for (const testCase of cases) {
  const reply = await ask(key, system, testCase.question);
  const problems = grade(testCase, reply);
  if (problems.length === 0) passed += 1;
  const snippet = reply.replace(/\s+/g, " ").slice(0, 100);
  console.log(`${problems.length === 0 ? "PASS" : "FAIL"} ${testCase.id}: ${snippet}`);
  if (problems.length > 0) console.log(`     ${problems.join("; ")}`);
}
console.log(`${passed}/${cases.length} passed`);
process.exit(passed === cases.length ? 0 : 1);
