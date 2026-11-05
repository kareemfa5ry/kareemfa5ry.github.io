// Unit checks for errorMessageFor in worker/src/claude_stream.ts: which API errors read as "busy".
import assert from "node:assert/strict";
import { test } from "node:test";
import Anthropic from "@anthropic-ai/sdk";
import { BUSY_MESSAGE, errorMessageFor, UNAVAILABLE_MESSAGE } from "../src/claude_stream.ts";

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
