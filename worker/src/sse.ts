// Server-sent events for the chat stream: one `data: <json>` frame per event, as UTF-8 bytes.
// JSON.stringify escapes newlines, so every frame is a single data line. Read by claude_stream.ts and tests.

export type ChatEvent = { text: string } | { done: true } | { error: string };

const encoder = new TextEncoder();

export function encodeEvent(event: ChatEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}
