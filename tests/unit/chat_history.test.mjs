// trimHistory (src/islands/chat/chat_history.ts): limits, pair dropping, ends with the user turn.
import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_CHARS, MAX_MESSAGES, trimHistory } from "../../src/islands/chat/chat_history.ts";

/** n alternating turns starting with the user, each `size` characters long, then a final user turn. */
function conversation(n, size = 10) {
  const turns = Array.from({ length: n }, (_, i) => ({
    role: i % 2 === 0 ? "user" : "assistant",
    content: String(i).padEnd(size, "x"),
  }));
  return [...turns, { role: "user", content: "last" }];
}

test("a conversation under the limits is unchanged", () => {
  const messages = conversation(4);
  assert.deepEqual(trimHistory(messages), messages);
});

test("ten messages keep the last eight, starting with a user turn", () => {
  const messages = conversation(9);
  assert.equal(messages.length, 10);
  const kept = trimHistory(messages);
  assert.equal(kept.length, MAX_MESSAGES);
  assert.equal(kept[0].role, "user");
  assert.deepEqual(kept, messages.slice(2));
  // Nine messages are one over the limit: a whole pair goes, so the history still starts with the user.
  const nine = trimHistory(conversation(8));
  assert.equal(nine.length, MAX_MESSAGES - 1);
  assert.equal(nine[0].role, "user");
});

test("over the character limit drops the oldest pairs until it fits", () => {
  const messages = conversation(6, 900);
  const kept = trimHistory(messages);
  assert.ok(kept.reduce((n, t) => n + t.content.length, 0) <= MAX_CHARS);
  assert.equal(kept[0].role, "user");
  assert.deepEqual(kept, messages.slice(messages.length - kept.length));
  assert.ok(kept.length < messages.length);
});

test("the result always ends with the new user message", () => {
  for (const messages of [conversation(0), conversation(9), conversation(6, 900)]) {
    const kept = trimHistory(messages);
    assert.deepEqual(kept[kept.length - 1], messages[messages.length - 1]);
    assert.equal(kept[kept.length - 1].role, "user");
  }
});
