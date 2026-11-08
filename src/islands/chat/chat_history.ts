// The history the chat sends to the Worker: trimmed to the Worker's limits (worker/src/guards.ts).
export interface Turn {
  role: "user" | "assistant";
  content: string;
}

// First line of defence: only the last 3 exchanges (6 messages) plus the new question are sent, so old long
// answers are gone before the Worker's caps (8 messages, 20000 characters) can trigger.
export const MAX_MESSAGES = 7;
export const MAX_CHARS = 20000;

/**
 * `messages` is the past conversation followed by the new user turn. Oldest completed pairs go first until the
 * request fits the limits; the new user turn always stays last.
 */
export function trimHistory(messages: Turn[], limits = { maxMessages: MAX_MESSAGES, maxChars: MAX_CHARS }): Turn[] {
  const next = messages[messages.length - 1];
  const size = (turns: Turn[]) => turns.reduce((n, t) => n + t.content.length, 0);
  let turns = messages.slice(0, -1);
  while (
    turns.length > 0 &&
    (turns.length + 1 > limits.maxMessages || size(turns) + next.content.length > limits.maxChars)
  ) {
    turns = turns.slice(2);
  }
  return [...turns, next];
}
