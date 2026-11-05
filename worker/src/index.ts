// Chat endpoint Worker (router only). POST /chat runs the guards in order (origin, body, Turnstile, rate limit),
// then streams Claude's answer as SSE; OPTIONS /chat is the CORS preflight; everything else is 404.
// Workers-only types are imported, not global, because the root `astro check` also type-checks this folder.
import type { RateLimit } from "@cloudflare/workers-types";
import { streamAnswer, UNAVAILABLE_MESSAGE } from "./claude_stream.ts";
import { isAllowedOrigin, readChatRequest, type ChatRequest } from "./guards.ts";
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
}

const CHAT_PATH = "/chat";

function jsonError(status: number, error: string, headers: Record<string, string> = {}): Response {
  return Response.json({ error }, { status, headers });
}

function corsHeaders(origin: string): Record<string, string> {
  return { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
}

function preflight(origin: string): Response {
  const headers = { ...corsHeaders(origin), "Access-Control-Allow-Methods": "POST, OPTIONS" };
  return new Response(null, {
    status: 204,
    headers: { ...headers, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" },
  });
}

async function answer(chat: ChatRequest, env: Env, cors: Record<string, string>): Promise<Response> {
  let knowledge: string;
  try {
    knowledge = await readKnowledge(env.SITE_URL);
  } catch (error) {
    console.error("knowledge unavailable:", error);
    return jsonError(503, UNAVAILABLE_MESSAGE, cors);
  }
  const system = buildSystemPrompt(knowledge);
  const body = streamAnswer({ apiKey: env.ANTHROPIC_API_KEY, system, messages: chat.messages });
  const sse = { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" };
  return new Response(body, { headers: { ...cors, ...sse } });
}

async function handleChat(request: Request, env: Env, origin: string): Promise<Response> {
  const cors = corsHeaders(origin);
  const verdict = readChatRequest(await request.json().catch(() => null));
  if (!verdict.ok) return jsonError(400, verdict.error, cors);
  const ip = request.headers.get("CF-Connecting-IP") ?? "";
  if (!(await verifyTurnstile(verdict.chat.turnstileToken, ip, env.TURNSTILE_SECRET_KEY))) {
    return jsonError(403, "Verification failed. Reload the page and try again.", cors);
  }
  const { success } = await env.CHAT_RATE_LIMIT.limit({ key: ip || "unknown" });
  if (!success) return jsonError(429, "Too many questions. Try again in a minute.", cors);
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
    if (request.method === "OPTIONS") return preflight(origin);
    return handleChat(request, env, origin);
  },
};
