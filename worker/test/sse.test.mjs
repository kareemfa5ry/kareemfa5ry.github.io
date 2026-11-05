// Unit checks for worker/src/sse.ts: each chat event is one `data:` line ending in a blank line.
import assert from "node:assert/strict";
import { test } from "node:test";
import { encodeEvent } from "../src/sse.ts";

const decode = (bytes) => new TextDecoder().decode(bytes);

test("sse: a text event with newlines stays on one data line", () => {
  assert.equal(decode(encodeEvent({ text: "line one\nline two" })), 'data: {"text":"line one\\nline two"}\n\n');
});

test("sse: done and error events", () => {
  assert.equal(decode(encodeEvent({ done: true })), 'data: {"done":true}\n\n');
  assert.equal(decode(encodeEvent({ error: "busy" })), 'data: {"error":"busy"}\n\n');
});

test("sse: Arabic text is encoded as UTF-8", () => {
  assert.equal(decode(encodeEvent({ text: "مرحبا" })), 'data: {"text":"مرحبا"}\n\n');
});
