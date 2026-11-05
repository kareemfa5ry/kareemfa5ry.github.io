// Turnstile server-side check: asks Cloudflare siteverify whether the widget token is valid for this visitor.
// Read by index.ts. Any failure (rejected token, other hostname, network, bad JSON) counts as not verified.

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

interface SiteverifyResult {
  success: boolean;
  hostname?: string;
  "error-codes"?: string[];
}

export interface TurnstileCheck {
  token: string;
  remoteIp: string;
  secret: string;
  // The site's hostname: a token solved on any other site is rejected.
  hostname: string;
}

export async function verifyTurnstile({ token, remoteIp, secret, hostname }: TurnstileCheck): Promise<boolean> {
  const body = { secret, response: token, ...(remoteIp ? { remoteip: remoteIp } : {}) };
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as SiteverifyResult;
    if (result.success !== true) console.error("turnstile rejected the token:", result["error-codes"]);
    else if (result.hostname !== hostname) console.error("turnstile token is for another host:", result.hostname);
    return result.success === true && result.hostname === hostname;
  } catch (error) {
    console.error("turnstile siteverify failed:", error);
    return false;
  }
}
