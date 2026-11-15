// Shared by the chat specs: a stubbed Turnstile and a canned Worker answer.
import type { Page } from "@playwright/test";

export const SSE = 'data: {"text":"Hello from the stub."}\n\ndata: {"done":true}\n\n';

/** Replaces window.turnstile before the page scripts run; `failAlways` makes every execute fail. */
export async function stub(page: Page, failAlways: boolean) {
  await page.addInitScript((always) => {
    const w = window as unknown as Record<string, unknown>;
    const calls = { execute: 0, remove: 0 };
    let opts: Record<string, (v: string) => void> = {};
    w.__calls = calls;
    w.turnstile = {
      render: (_el: unknown, o: typeof opts) => ((opts = o), "w" + Math.random()),
      execute: () => {
        calls.execute++;
        if (always || calls.execute === 2) opts["error-callback"]("300030");
        else opts.callback(calls.execute === 1 ? "tok" : "tok2");
      },
      reset: () => {},
      remove: () => calls.remove++,
    };
  }, failAlways);
  await page.route("https://challenges.cloudflare.com/turnstile/v0/api.js*", (r) =>
    r.fulfill({ contentType: "text/javascript", body: "" }),
  );
  await page.route("**/chat", (r) => r.fulfill({ contentType: "text/event-stream", body: SSE }));
}
