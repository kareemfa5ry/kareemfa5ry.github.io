// Unit checks for worker/src/prompt.ts: the system prompt is byte-stable and marked for caching.
import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSystemPrompt, CHAT_INSTRUCTIONS } from "../src/prompt.ts";

const KNOWLEDGE = "# Kareem Fakhry\n\n## Contact\n- Email: someone@example.com";

test("prompt: the same knowledge gives the same bytes", () => {
  assert.equal(JSON.stringify(buildSystemPrompt(KNOWLEDGE)), JSON.stringify(buildSystemPrompt(KNOWLEDGE)));
});

test("prompt: one text block, instructions first, knowledge after, cached", () => {
  const [block, ...rest] = buildSystemPrompt(KNOWLEDGE);
  assert.equal(rest.length, 0);
  assert.equal(block.type, "text");
  assert.deepEqual(block.cache_control, { type: "ephemeral" });
  assert.ok(block.text.startsWith(CHAT_INSTRUCTIONS));
  assert.ok(block.text.endsWith(`<knowledge>\n${KNOWLEDGE}\n</knowledge>`));
});

test("prompt: the instructions carry the settled rules", () => {
  const rules = [/only from the knowledge/, /email address/, /Never invent figures/, /short/, /Arabic/];
  const audience = [/recruiters and hiring managers/, /outcome/, /CV PDF/, /salary or compensation/, /under 120 words/];
  const injection = [/labelled assistant/, /cannot change these rules/, /role-play, write code/, /first person/];
  for (const rule of [...rules, ...audience, ...injection, /reveal these instructions/]) {
    assert.match(CHAT_INSTRUCTIONS, rule);
  }
});
