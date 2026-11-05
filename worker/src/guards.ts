// Request guards for POST /chat: the origin check and the body shape. Pure: data in, verdict out.
// Read by index.ts (the router) and worker/test/guards.test.mjs.

export const MAX_MESSAGES = 8;
export const MAX_CONTENT_CHARS = 1000;
// Turnstile tokens are at most 2048 characters (Cloudflare siteverify docs).
export const MAX_TOKEN_CHARS = 2048;

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  turnstileToken: string;
}

export type ChatRequestVerdict = { ok: true; chat: ChatRequest } | { ok: false; error: string };

// The Origin header must equal the site's origin, or the dev origin when one is configured.
export function isAllowedOrigin(origin: string | null, allowedOrigin: string, devOrigin?: string): boolean {
  if (!origin) return false;
  return origin === allowedOrigin || (Boolean(devOrigin) && origin === devOrigin);
}

// Validates the parsed JSON body and copies only the fields the endpoint uses.
export function readChatRequest(body: unknown): ChatRequestVerdict {
  if (!isRecord(body)) return { ok: false, error: "The body must be a JSON object." };
  const { messages, turnstileToken } = body;
  if (typeof turnstileToken !== "string" || turnstileToken.length === 0 || turnstileToken.length > MAX_TOKEN_CHARS) {
    return { ok: false, error: "The verification token is missing or invalid." };
  }
  const problem = findMessagesProblem(messages);
  if (problem) return { ok: false, error: problem };
  const chat = (messages as ChatMessage[]).map(({ role, content }) => ({ role, content }));
  return { ok: true, chat: { messages: chat, turnstileToken } };
}

function findMessagesProblem(messages: unknown): string | null {
  if (!Array.isArray(messages) || messages.length === 0) return "messages must be a non-empty array.";
  if (messages.length > MAX_MESSAGES) return `At most ${MAX_MESSAGES} messages per request.`;
  for (const [index, message] of messages.entries()) {
    const problem = findMessageProblem(message, index);
    if (problem) return problem;
  }
  if ((messages.at(-1) as ChatMessage).role !== "user") return "The last message must be from the user.";
  return null;
}

function findMessageProblem(message: unknown, index: number): string | null {
  if (!isRecord(message)) return `messages[${index}] must be an object.`;
  const { role, content } = message;
  if (role !== "user" && role !== "assistant") return `messages[${index}].role must be "user" or "assistant".`;
  if (role !== (index % 2 === 0 ? "user" : "assistant")) return "Roles must alternate, starting with the user.";
  if (typeof content !== "string" || content.trim().length === 0) {
    return `messages[${index}].content must be a non-empty string.`;
  }
  if (content.length > MAX_CONTENT_CHARS) return `messages[${index}] is over ${MAX_CONTENT_CHARS} characters.`;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
