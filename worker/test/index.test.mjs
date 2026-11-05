// Router checks for worker/src/index.ts: the guard order and their status codes, with fake rate-limit bindings,
// fake secrets and a stubbed global fetch (siteverify, llms.txt). No test reaches the Anthropic API.
import assert from "node:assert/strict";
import { after, beforeEach, test } from "node:test";
import worker from "../src/index.ts";

const SITE = "https://kareemfa5ry.github.io";
const SITE_HOST = "kareemfa5ry.github.io";
const realFetch = globalThis.fetch;
let fetched = [];

const limiter = (success) => ({
  keys: [],
  async limit({ key }) {
    this.keys.push(key);
    return { success };
  },
});

const makeEnv = ({ perIp = true, global = true } = {}) => ({
  ANTHROPIC_API_KEY: "sk-ant-test-not-a-key",
  TURNSTILE_SECRET_KEY: "turnstile-test-secret",
  ALLOWED_ORIGIN: SITE,
  SITE_URL: SITE,
  CHAT_RATE_LIMIT: limiter(perIp),
  GLOBAL_LIMIT: limiter(global),
});

const plainText = (text) => new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });

function stubFetch({ turnstile = { success: true, hostname: SITE_HOST }, llms = () => plainText("# Kareem") } = {}) {
  globalThis.fetch = async (input) => {
    const url = String(input instanceof Request ? input.url : input);
    fetched.push(url);
    if (url.includes("/turnstile/v0/siteverify")) return Response.json(turnstile);
    if (url.endsWith("/llms.txt")) return llms();
    throw new Error(`unexpected fetch: ${url}`);
  };
}

function post(headers = {}) {
  const body = JSON.stringify({ messages: [{ role: "user", content: "What does Kareem do?" }], turnstileToken: "t" });
  const base = { Origin: SITE, "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.7" };
  const length = String(new TextEncoder().encode(body).length);
  return new Request("https://chat.example/chat", {
    method: "POST",
    body,
    headers: { ...base, "Content-Length": length, ...headers },
  });
}

const errorOf = async (response) => (await response.json()).error;
const calledClaude = () => fetched.some((url) => url.includes("api.anthropic.com"));

beforeEach(() => {
  fetched = [];
  stubFetch();
});
after(() => {
  globalThis.fetch = realFetch;
});

test("router: a foreign origin is 403 before anything is fetched", async () => {
  const response = await worker.fetch(post({ Origin: "https://evil.example" }), makeEnv());
  assert.equal(response.status, 403);
  assert.deepEqual(fetched, []);
});

test("router: an oversized or missing Content-Length is 413", async () => {
  assert.equal((await worker.fetch(post({ "Content-Length": "40000" }), makeEnv())).status, 413);
  const request = post();
  request.headers.delete("Content-Length");
  assert.equal((await worker.fetch(request, makeEnv())).status, 413);
  assert.deepEqual(fetched, []);
});

test("router: a rejected Turnstile token is 403, with no rate-limit or Claude call", async () => {
  stubFetch({ turnstile: { success: false, "error-codes": ["invalid-input-response"] } });
  const env = makeEnv();
  const response = await worker.fetch(post(), env);
  assert.equal(response.status, 403);
  assert.match(await errorOf(response), /Verification failed/);
  assert.equal(calledClaude(), false);
  assert.deepEqual(env.CHAT_RATE_LIMIT.keys, []);
});

test("router: a Turnstile token solved on another hostname is 403", async () => {
  stubFetch({ turnstile: { success: true, hostname: "example.com" } });
  const response = await worker.fetch(post(), makeEnv());
  assert.equal(response.status, 403);
  assert.equal(calledClaude(), false);
});

test("router: the per-IP limit is 429 and the global limit is not touched", async () => {
  const env = makeEnv({ perIp: false });
  const response = await worker.fetch(post(), env);
  assert.equal(response.status, 429);
  assert.deepEqual(env.CHAT_RATE_LIMIT.keys, ["203.0.113.7"]);
  assert.deepEqual(env.GLOBAL_LIMIT.keys, []);
});

test("router: the global limit is 429, keyed 'global', and IPv6 visitors share their /64", async () => {
  const env = makeEnv({ global: false });
  const response = await worker.fetch(post({ "CF-Connecting-IP": "2001:db8:1:2:3:4:5:6" }), env);
  assert.equal(response.status, 429);
  assert.match(await errorOf(response), /Too many questions/);
  assert.deepEqual(env.CHAT_RATE_LIMIT.keys, ["2001:0db8:0001:0002::/64"]);
  assert.deepEqual(env.GLOBAL_LIMIT.keys, ["global"]);
  assert.equal(calledClaude(), false);
});

test("router: llms.txt that is not text/plain, or 64 KB or more, is 503", async () => {
  stubFetch({ llms: () => new Response("<html></html>", { headers: { "Content-Type": "text/html" } }) });
  assert.equal((await worker.fetch(post(), makeEnv())).status, 503);
  stubFetch({ llms: () => plainText("x".repeat(65536)) });
  assert.equal((await worker.fetch(post(), makeEnv())).status, 503);
  assert.equal(calledClaude(), false);
});

test("the entry module exports only the handler (workerd rejects other exports)", async () => {
  assert.deepEqual(Object.keys(await import("../src/index.ts")), ["default"]);
});
