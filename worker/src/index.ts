// Chat endpoint Worker (router only). POST /chat runs the guards in order (origin, body size, body shape,
// Turnstile, per-IP then global rate limit), then streams Claude's answer as SSE; OPTIONS /chat is the CORS
// preflight; everything else is 404. The default export is the handler; worker/test/index.test.mjs calls it.
// Workers-only types are imported, not global, because the root `astro check` also type-checks this folder.
import type { RateLimit } from "@cloudflare/workers-types";
import { streamAnswer, UNAVAILABLE_MESSAGE } from "./claude_stream.ts";
import { isAllowedOrigin, isBodySizeAllowed, rateLimitKey, readChatRequest, type ChatRequest } from "./guards.ts";
import { corsHeaders, jsonError, preflightResponse, SSE_HEADERS } from "./http_responses.ts";
import { readKnowledge } from "./knowledge.ts";
import { buildSystemPrompt } from "./prompt.ts";
import { verifyTurnstile } from "./turnstile.ts";

export interface Env {
  ANTHROPIC_API_KEY: string;
  TURNSTILE_SECRET_KEY: string;
  ALLOWED_ORIGIN: string;
  SITE_URL: string;
  DEV_ORIGIN?: string;
  CHAT_RATE_LIMIT: RateLimit;
  GLOBAL_LIMIT: RateLimit;
}

const CHAT_PATH = "/chat";
const GLOBAL_LIMIT_KEY = "global";
export const TOO_MANY_MESSAGE = "Too many questions. Try again in a minute.";

async function isUnderRateLimits(env: Env, ip: string): Promise<boolean> {
  if (!(await env.CHAT_RATE_LIMIT.limit({ key: rateLimitKey(ip) })).success) return false;
  return (await env.GLOBAL_LIMIT.limit({ key: GLOBAL_LIMIT_KEY })).success;
}

async function answer(chat: ChatRequest, env: Env, cors: Record<string, string>): Promise<Response> {
  let knowledge: string;
  try {
    knowledge = await readKnowledge(env.SITE_URL);
  } catch (error) {
    console.error("knowledge unavailable:", error);
    return jsonError(503, UNAVAILABLE_MESSAGE, cors);
  }
  const body = streamAnswer({
    apiKey: env.ANTHROPIC_API_KEY,
    system: buildSystemPrompt(knowledge),
    messages: chat.messages,
  });
  return new Response(body, { headers: { ...cors, ...SSE_HEADERS } });
}

async function handleChat(request: Request, env: Env, origin: string): Promise<Response> {
  const cors = corsHeaders(origin);
  if (!isBodySizeAllowed(request.headers.get("Content-Length")))
    return jsonError(413, "The request is too large.", cors);
  const verdict = readChatRequest(await request.json().catch(() => null));
  if (!verdict.ok) return jsonError(400, verdict.error, cors);
  const remoteIp = request.headers.get("CF-Connecting-IP") ?? "";
  const hostname = new URL(env.ALLOWED_ORIGIN).hostname;
  const token = verdict.chat.turnstileToken;
  if (!(await verifyTurnstile({ token, remoteIp, secret: env.TURNSTILE_SECRET_KEY, hostname }))) {
    return jsonError(403, "Verification failed. Reload the page and try again.", cors);
  }
  if (!(await isUnderRateLimits(env, remoteIp))) return jsonError(429, TOO_MANY_MESSAGE, cors);
  return answer(verdict.chat, env, cors);
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const isChatMethod = request.method === "POST" || request.method === "OPTIONS";
    if (new URL(request.url).pathname !== CHAT_PATH || !isChatMethod) return jsonError(404, "Not found.");
    const origin = request.headers.get("Origin");
    if (!origin || !isAllowedOrigin(origin, env.ALLOWED_ORIGIN, env.DEV_ORIGIN)) {
      return jsonError(403, "This origin is not allowed.");
    }
    if (request.method === "OPTIONS") return preflightResponse(origin);
    return handleChat(request, env, origin);
  },
};
