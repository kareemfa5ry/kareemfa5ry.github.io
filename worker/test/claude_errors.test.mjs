// Unit checks for worker/src/claude_stream.ts: the closing frame per stop reason and which errors read as "busy".
import assert from "node:assert/strict";
import { test } from "node:test";
import Anthropic from "@anthropic-ai/sdk";
import {
  BUSY_MESSAGE,
  closingEvent,
  CUT_SHORT_MESSAGE,
  errorMessageFor,
  REFUSAL_MESSAGE,
  UNAVAILABLE_MESSAGE,
} from "../src/claude_stream.ts";

const apiError = (status) => Anthropic.APIError.generate(status, { type: "error" }, "test", new Headers());

test("errors: rate limit (429) and overloaded (529) are busy", () => {
  assert.equal(errorMessageFor(apiError(429)), BUSY_MESSAGE);
  assert.equal(errorMessageFor(apiError(529)), BUSY_MESSAGE);
});

test("errors: auth, bad request and unknown errors are the generic message", () => {
  assert.equal(errorMessageFor(apiError(401)), UNAVAILABLE_MESSAGE);
  assert.equal(errorMessageFor(apiError(400)), UNAVAILABLE_MESSAGE);
  assert.equal(errorMessageFor(new Error("boom")), UNAVAILABLE_MESSAGE);
});

test("errors: a client abort is not logged as a failure", (t) => {
  const logged = t.mock.method(console, "error", () => {});
  errorMessageFor(new Anthropic.APIUserAbortError());
  errorMessageFor(new DOMException("aborted", "AbortError"));
  assert.equal(logged.mock.callCount(), 0);
  errorMessageFor(new Error("boom"));
  assert.equal(logged.mock.callCount(), 1);
});

test("closing frame: refusal and max_tokens are errors, end_turn is done", () => {
  assert.deepEqual(closingEvent("refusal"), { error: REFUSAL_MESSAGE });
  assert.deepEqual(closingEvent("max_tokens"), { error: CUT_SHORT_MESSAGE });
  assert.deepEqual(closingEvent("end_turn"), { done: true });
});
