// One chat turn against Claude: streams the answer from the Anthropic API as chat SSE frames (see sse.ts).
// Read by index.ts; closingEvent and errorMessageFor are also read by worker/test/claude_errors.test.mjs.
import Anthropic from "@anthropic-ai/sdk";
import type { ChatMessage } from "./guards.ts";
import { encodeEvent, type ChatEvent } from "./sse.ts";

export const CHAT_MODEL = "claude-sonnet-5-5";
export const MAX_ANSWER_TOKENS = 600;
// `fallbacks: "default"` (Claude API only) retries a policy decline on Anthropic's recommended model.
const SERVER_SIDE_FALLBACK_BETA = "server-side-fallback-2026-07-01";

export const BUSY_MESSAGE = "The assistant is busy, try again in a minute.";
export const UNAVAILABLE_MESSAGE = "The assistant is unavailable right now. Please use the email on this page.";
export const REFUSAL_MESSAGE = "Sorry, I can't help with that. Ask me about Kareem's work, skills or experience.";
export const CUT_SHORT_MESSAGE = "The answer was cut short. Ask a narrower question.";

export interface ChatTurn {
  apiKey: string;
  system: Anthropic.Beta.BetaTextBlockParam[];
  messages: ChatMessage[];
}

// Text frames as they arrive, then one closing frame: done, or a short user-facing error.
export function streamAnswer(turn: ChatTurn): ReadableStream<Uint8Array> {
  const abort = new AbortController();
  return new ReadableStream({
    async start(controller) {
      const send = (event: ChatEvent) => controller.enqueue(encodeEvent(event));
      const closing = await relayAnswer(turn, send, abort.signal);
      if (abort.signal.aborted) return;
      send(closing);
      controller.close();
    },
    // The visitor closed the page: stop generating tokens nobody will read.
    cancel() {
      abort.abort();
    },
  });
}

async function relayAnswer(turn: ChatTurn, send: (event: ChatEvent) => void, signal: AbortSignal) {
  try {
    const client = new Anthropic({ apiKey: turn.apiKey });
    const stream = client.beta.messages.stream(
      {
        model: CHAT_MODEL,
        max_tokens: MAX_ANSWER_TOKENS,
        output_config: { effort: "low" },
        betas: [SERVER_SIDE_FALLBACK_BETA],
        fallbacks: "default",
        system: turn.system,
        messages: turn.messages,
      },
      { signal },
    );
    stream.on("text", (text) => send({ text }));
    return closingEvent((await stream.finalMessage()).stop_reason);
  } catch (error) {
    return { error: errorMessageFor(error) };
  }
}

// The last frame for a finished answer: a refusal or a cut-off answer is an error, anything else is done.
export function closingEvent(stopReason: string | null): ChatEvent {
  if (stopReason === "refusal") return { error: REFUSAL_MESSAGE };
  if (stopReason === "max_tokens") return { error: CUT_SHORT_MESSAGE };
  return { done: true };
}

// Rate limit and overload are temporary; a client abort is not a failure (nobody reads the frame);
// everything else (auth, config, bad request) is logged, not shown.
export function errorMessageFor(error: unknown): string {
  if (error instanceof Anthropic.RateLimitError || error instanceof Anthropic.OverloadedError) return BUSY_MESSAGE;
  const aborted =
    error instanceof Anthropic.APIUserAbortError || (error instanceof Error && error.name === "AbortError");
  if (!aborted) console.error("claude request failed:", error);
  return UNAVAILABLE_MESSAGE;
}
