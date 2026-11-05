// Unit checks for worker/src/guards.ts: one failing-by-value case per origin and body rule.
import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowedOrigin, MAX_CONTENT_CHARS, MAX_MESSAGES, readChatRequest } from "../src/guards.ts";

const SITE = "https://kareemfa5ry.github.io";
const DEV = "http://localhost:4321";
const TOKEN = "turnstile-token";
const ask = (content = "What does Kareem do?") => ({ role: "user", content });
const reply = (content = "He is a data analyst.") => ({ role: "assistant", content });
const errorOf = (body) => {
  const verdict = readChatRequest(body);
  assert.equal(verdict.ok, false, "expected the body to be rejected");
  return verdict.error;
};

test("origin: only the site origin passes", () => {
  assert.equal(isAllowedOrigin(SITE, SITE), true);
  assert.equal(isAllowedOrigin("https://evil.example", SITE), false);
  assert.equal(isAllowedOrigin(`${SITE}/`, SITE), false);
  assert.equal(isAllowedOrigin(null, SITE), false);
});

test("origin: the dev origin passes only when it is configured", () => {
  assert.equal(isAllowedOrigin(DEV, SITE), false);
  assert.equal(isAllowedOrigin(DEV, SITE, ""), false);
  assert.equal(isAllowedOrigin(DEV, SITE, DEV), true);
});

test("body: a valid conversation passes and extra fields are dropped", () => {
  const extra = { ...ask(), cache_control: { type: "ephemeral" } };
  const verdict = readChatRequest({ messages: [ask(), reply(), extra], turnstileToken: TOKEN });
  assert.deepEqual(verdict, { ok: true, chat: { messages: [ask(), reply(), ask()], turnstileToken: TOKEN } });
});

test("body: must be a JSON object with a token", () => {
  assert.match(errorOf(null), /JSON object/);
  assert.match(errorOf([ask()]), /JSON object/);
  assert.match(errorOf({ messages: [ask()] }), /verification token/);
  assert.match(errorOf({ messages: [ask()], turnstileToken: "x".repeat(2049) }), /verification token/);
});

test("body: messages must be a non-empty array", () => {
  assert.match(errorOf({ messages: [], turnstileToken: TOKEN }), /non-empty array/);
  assert.match(errorOf({ messages: "hi", turnstileToken: TOKEN }), /non-empty array/);
});

test(`body: at most ${MAX_MESSAGES} messages`, () => {
  const nine = Array.from({ length: MAX_MESSAGES + 1 }, (_, i) => (i % 2 === 0 ? ask() : reply()));
  assert.match(errorOf({ messages: nine, turnstileToken: TOKEN }), /At most 8 messages/);
});

test(`body: each message at most ${MAX_CONTENT_CHARS} characters and not empty`, () => {
  const long = ask("x".repeat(MAX_CONTENT_CHARS + 1));
  assert.match(errorOf({ messages: [long], turnstileToken: TOKEN }), /over 1000 characters/);
  assert.match(errorOf({ messages: [ask("   ")], turnstileToken: TOKEN }), /non-empty string/);
  const exact = readChatRequest({ messages: [ask("x".repeat(MAX_CONTENT_CHARS))], turnstileToken: TOKEN });
  assert.equal(exact.ok, true);
});

test("body: the last message is from the user", () => {
  assert.match(errorOf({ messages: [ask(), reply()], turnstileToken: TOKEN }), /last message/);
});

test("body: roles alternate, starting with the user", () => {
  assert.match(errorOf({ messages: [ask(), ask()], turnstileToken: TOKEN }), /alternate/);
  assert.match(errorOf({ messages: [reply(), ask()], turnstileToken: TOKEN }), /alternate/);
  assert.match(errorOf({ messages: [{ role: "system", content: "x" }], turnstileToken: TOKEN }), /role must be/);
});
