// The chat survives a failed human check on a later turn (src/islands/useChatStream.ts); Turnstile is stubbed.
import { expect, test, type Page } from "@playwright/test";

const SSE = 'data: {"text":"Hello from the stub."}\n\ndata: {"done":true}\n\n';

/** Replaces window.turnstile before the page scripts run; `failAlways` makes every execute fail. */
async function stub(page: Page, failAlways: boolean) {
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

async function ask(page: Page, question: string) {
  await page.getByLabel("Your question").fill(question);
  await page.getByRole("button", { name: "Send" }).click();
}

test("a failed human check on turn two is retried once and both answers appear", async ({ page }) => {
  await stub(page, false);
  await page.goto("/", { waitUntil: "networkidle" }); // client:idle hydration
  await ask(page, "First?");
  await expect(page.getByText("Hello from the stub.")).toHaveCount(1);
  await ask(page, "Second?");
  await expect(page.getByText("Hello from the stub.")).toHaveCount(2);
  expect(await page.evaluate(() => (window as unknown as { __calls: { remove: number } }).__calls.remove)).toBe(1);
  await expect(page.getByText("Could not reach")).toHaveCount(0);
  await expect(page.getByText("human check")).toHaveCount(0);
});

test("a human check that keeps failing says so and logs the code", async ({ page }) => {
  const logs: string[] = [];
  page.on("console", (m) => m.type() === "error" && logs.push(m.text()));
  await stub(page, true);
  await page.goto("/", { waitUntil: "networkidle" }); // client:idle hydration
  await ask(page, "First?");
  await expect(page.getByText("The human check did not complete.")).toBeVisible();
  expect(logs.some((t) => t.includes("Turnstile"))).toBe(true);
});
