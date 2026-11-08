// The chat survives a failed human check on a later turn (src/islands/chat/useChatStream.ts); Turnstile is stubbed.
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
  const dialog = page.getByRole("dialog", { name: "Ask about Kareem" });
  if (!(await dialog.isVisible())) await page.locator(`button[aria-label="Ask about Kareem"]`).click();
  await expect(dialog).toBeVisible();
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

test("six starter chips show on open and tapping one sends its prompt, not its label", async ({ page }) => {
  await stub(page, false);
  await page.goto("/", { waitUntil: "networkidle" }); // client:idle hydration
  await page.locator(`button[aria-label="Ask about Kareem"]`).click();
  const group = page.getByRole("group", { name: "Suggested questions" });
  await expect(group.getByRole("button")).toHaveText([
    "Tech stack",
    "Transferable skills",
    "Leadership",
    "Results",
    "Career in brief",
    "Contact",
  ]);
  await group.getByRole("button", { name: "Contact" }).click();
  await expect(
    page.getByRole("log").getByText("How can I reach Kareem, and where can I download his CV?"),
  ).toBeVisible();
  await expect(page.getByText("Hello from the stub.")).toHaveCount(1);
});

async function openWithStub(page: Page) {
  await stub(page, false);
  await page.goto("/", { waitUntil: "networkidle" }); // client:idle hydration
  await page.locator(`button[aria-label="Ask about Kareem"]`).click();
  return page.getByRole("group", { name: "Suggested questions" });
}

test("a used chip leaves the row above the composer; the other five stay", async ({ page }) => {
  const group = await openWithStub(page);
  await group.getByRole("button", { name: "Contact" }).click();
  await expect(page.getByText("Hello from the stub.")).toHaveCount(1);
  await expect(group.getByRole("button")).toHaveText([
    "Tech stack",
    "Transferable skills",
    "Leadership",
    "Results",
    "Career in brief",
  ]);
  await page.screenshot({ path: test.info().outputPath("chat-followups.png") }); // for eyeballing; test-results is ignored
});

test("a free-text first question means no chips at all", async ({ page }) => {
  const group = await openWithStub(page);
  await ask(page, "My own question?");
  await expect(page.getByText("Hello from the stub.")).toHaveCount(1);
  await expect(group).toHaveCount(0);
});

const LONG = JSON.stringify({ text: Array.from({ length: 80 }, (_, i) => `Line ${i}\n`).join("") + "THE END" });
const longReply = (page: Page) =>
  page.route("**/chat", (r) => r.fulfill({ contentType: "text/event-stream", body: `data: ${LONG}\n\n` }));
const gap = (page: Page) => page.getByRole("log").evaluate((el) => el.scrollHeight - el.scrollTop - el.clientHeight);

test("a long reply keeps its newest text in view", async ({ page }) => {
  await openWithStub(page);
  await longReply(page);
  await ask(page, "Tell me everything");
  await expect(page.getByText("THE END")).toBeVisible();
  await expect.poll(() => gap(page)).toBeLessThanOrEqual(2);
  await page.screenshot({ path: test.info().outputPath("chat-autoscroll.png") }); // for eyeballing; test-results is ignored
});

test("a visitor who scrolled up is not pulled down by the next reply", async ({ page }) => {
  await openWithStub(page);
  await longReply(page);
  await ask(page, "First");
  await expect(page.getByText("THE END")).toHaveCount(1);
  await page.getByRole("log").evaluate((el) => el.scrollTo(0, 0));
  await ask(page, "Second");
  await expect(page.getByText("THE END")).toHaveCount(2);
  expect(await page.getByRole("log").evaluate((el) => el.scrollTop)).toBeLessThanOrEqual(48);
});

const TOKEN = "x".repeat(120);
const CONTACT = JSON.stringify({
  text:
    `Reach Kareem at kareemfa5ry@gmail.com or read the Senior Data Analyst CV: ` +
    `https://kareemfa5ry.github.io/cv/Kareem_Fakhry_CV_Senior_Data_Analyst.pdf ${TOKEN}`,
});

test("a reply with a long token neither overflows nor clips, and its email and URL are links", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openWithStub(page);
  await page.route("**/chat", (r) => r.fulfill({ contentType: "text/event-stream", body: `data: ${CONTACT}\n\n` }));
  await page.getByRole("button", { name: "Dock to side" }).click();
  await ask(page, "How do I reach Kareem?");
  const reply = page.getByRole("log").locator("li").last();
  await expect(reply.getByRole("link", { name: "kareemfa5ry@gmail.com" })).toHaveAttribute(
    "href",
    "mailto:kareemfa5ry@gmail.com",
  );
  const cv = reply.getByRole("link", { name: "Kareem Fakhry CV Senior Data Analyst" });
  await expect(cv).toHaveAttribute("rel", "noopener noreferrer");
  await expect(cv).toHaveAttribute("target", "_blank");
  const fits = await page.getByRole("log").evaluate((el) => el.scrollWidth <= el.clientWidth);
  expect(fits).toBe(true);
  await page.screenshot({ path: test.info().outputPath("chat-readable.png") });
});

test("a 400 shows one plain sentence, returns the chip, and the retry leaves one user bubble", async ({ page }) => {
  const group = await openWithStub(page);
  let calls = 0;
  await page.route("**/chat", (r) =>
    ++calls === 1
      ? r.fulfill({
          status: 400,
          contentType: "application/json",
          body: '{"error":"messages[5] is over 1000 characters."}',
        })
      : r.fulfill({ contentType: "text/event-stream", body: SSE }),
  );
  const prompt = "How can I reach Kareem, and where can I download his CV?";
  await group.getByRole("button", { name: "Contact" }).click();
  await expect(page.getByText("Something went wrong on our side. Please try again or email")).toBeVisible();
  await expect(page.getByText("over 1000 characters")).toHaveCount(0);
  await expect(group.getByRole("button", { name: "Contact" })).toBeVisible();
  await group.getByRole("button", { name: "Contact" }).click();
  await expect(page.getByText("Hello from the stub.")).toHaveCount(1);
  await expect(page.getByText("Something went wrong")).toHaveCount(0);
  await expect(page.getByRole("log").getByText(prompt)).toHaveCount(1);
});
