// Request guards for POST /chat: origin, body size, body shape and the rate-limit key. Pure: data in, verdict out.
// Read by index.ts (the router) and worker/test/guards.test.mjs.

export const MAX_BODY_BYTES = 32768;
export const MAX_MESSAGES = 8;
// Only what the visitor typed is capped hard; a bot reply (up to ~3000 characters) is cut, not refused.
export const MAX_CONTENT_CHARS = 1000;
export const MAX_REPLY_CHARS = 4000;
export const MAX_TOTAL_CHARS = 20000;
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

// The Content-Length header must be present and at most MAX_BODY_BYTES, checked before the body is read.
export function isBodySizeAllowed(contentLength: string | null): boolean {
  return /^\d+$/.test(contentLength ?? "") && Number(contentLength) <= MAX_BODY_BYTES;
}

// Per-visitor rate-limit key: an IPv4 address as is, an IPv6 address by its /64 prefix (one home network).
export function rateLimitKey(ip: string): string {
  if (!ip) return "unknown";
  if (!ip.includes(":")) return ip;
  const [head, tail] = ip.toLowerCase().split("::");
  const left = head ? head.split(":") : [];
  const right = tail ? tail.split(":") : [];
  const zeros = tail === undefined ? [] : Array<string>(Math.max(0, 8 - left.length - right.length)).fill("0");
  const prefix = [...left, ...zeros, ...right].slice(0, 4).map((group) => group.padStart(4, "0"));
  return `${prefix.join(":")}::/64`;
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
  const chat = (messages as ChatMessage[]).map(({ role, content }) => ({
    role,
    content: role === "assistant" ? content.slice(0, MAX_REPLY_CHARS) : content,
  }));
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
  const total = (messages as ChatMessage[]).reduce(
    (sum, { role, content }) => sum + Math.min(content.length, role === "assistant" ? MAX_REPLY_CHARS : Infinity),
    0,
  );
  if (total > MAX_TOTAL_CHARS) return `The conversation is over ${MAX_TOTAL_CHARS} characters; start a new one.`;
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
  if (role === "user" && content.length > MAX_CONTENT_CHARS)
    return `A question is over ${MAX_CONTENT_CHARS} characters.`;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
