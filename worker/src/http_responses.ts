// The Worker's HTTP response shapes: JSON errors, CORS headers, the preflight answer and the SSE headers.
// Read by index.ts.

export const SSE_HEADERS = { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" };

export function jsonError(status: number, error: string, headers: Record<string, string> = {}): Response {
  return Response.json({ error }, { status, headers });
}

export function corsHeaders(origin: string): Record<string, string> {
  return { "Access-Control-Allow-Origin": origin, Vary: "Origin" };
}

export function preflightResponse(origin: string): Response {
  const headers = { ...corsHeaders(origin), "Access-Control-Allow-Methods": "POST, OPTIONS" };
  return new Response(null, {
    status: 204,
    headers: { ...headers, "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Max-Age": "86400" },
  });
}
