// The knowledge section of the chat prompt: the site's /llms.txt, fetched through Cloudflare's cache.
// Read by index.ts; the text it returns goes into prompt.ts unchanged so the system prompt stays byte-stable.
import type { RequestInit } from "@cloudflare/workers-types";

export const KNOWLEDGE_CACHE_SECONDS = 3600;

export async function readKnowledge(siteUrl: string): Promise<string> {
  // Only the fields both fetch typings share, so this also type-checks under the root (DOM) tsconfig.
  const cached: Pick<RequestInit, "method" | "cf"> = {
    method: "GET",
    cf: { cacheTtl: KNOWLEDGE_CACHE_SECONDS, cacheEverything: true },
  };
  const response = await fetch(new URL("/llms.txt", siteUrl), cached);
  if (!response.ok) throw new Error(`llms.txt fetch failed with HTTP ${response.status}`);
  return (await response.text()).trim();
}
