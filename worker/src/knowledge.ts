// The knowledge section of the chat prompt: the site's /llms.txt, fetched through Cloudflare's cache.
// Anything but a small text/plain success throws, and index.ts answers 503.
// Read by index.ts; the text it returns goes into prompt.ts unchanged so the system prompt stays byte-stable.
import type { RequestInit } from "@cloudflare/workers-types";

export const KNOWLEDGE_CACHE_SECONDS = 3600;
export const MAX_KNOWLEDGE_BYTES = 65536;
// Cache successes for an hour; never cache redirects or errors (-1 = do not cache).
const CACHE_TTL_BY_STATUS = { "200-299": KNOWLEDGE_CACHE_SECONDS, "300-599": -1 };

export async function readKnowledge(siteUrl: string): Promise<string> {
  // Only the fields both fetch typings share, so this also type-checks under the root (DOM) tsconfig.
  const cached: Pick<RequestInit, "method" | "cf"> = {
    method: "GET",
    cf: { cacheTtlByStatus: CACHE_TTL_BY_STATUS, cacheEverything: true },
  };
  const response = await fetch(new URL("/llms.txt", siteUrl), cached);
  if (!response.ok) throw new Error(`llms.txt fetch failed with HTTP ${response.status}`);
  const type = response.headers.get("Content-Type") ?? "";
  if (!type.startsWith("text/plain")) throw new Error(`llms.txt has content type "${type}", not text/plain`);
  const text = await response.text();
  const bytes = new TextEncoder().encode(text).length;
  if (bytes >= MAX_KNOWLEDGE_BYTES) throw new Error(`llms.txt is ${bytes} bytes, over ${MAX_KNOWLEDGE_BYTES}`);
  return text.trim();
}
