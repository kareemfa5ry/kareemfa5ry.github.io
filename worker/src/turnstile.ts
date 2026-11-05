// Turnstile server-side check: asks Cloudflare siteverify whether the widget token is valid for this visitor.
// Read by index.ts. Any failure (rejected token, network, bad JSON) counts as not verified.

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface SiteverifyResult {
  success: boolean;
  "error-codes"?: string[];
}

export async function verifyTurnstile(token: string, remoteIp: string, secret: string): Promise<boolean> {
  const body = { secret, response: token, ...(remoteIp ? { remoteip: remoteIp } : {}) };
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as SiteverifyResult;
    if (result.success !== true) console.error("turnstile rejected the token:", result["error-codes"]);
    return result.success === true;
  } catch (error) {
    console.error("turnstile siteverify failed:", error);
    return false;
  }
}
