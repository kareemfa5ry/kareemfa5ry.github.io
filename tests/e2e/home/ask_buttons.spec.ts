// Ready-question buttons: "Ask about this project" and two hero questions open the chat and send in one click.
import { expect, test } from "@playwright/test";
import { stub } from "../chat_stub";

test("Ask about this project opens the dialog and the first user line is the project question", async ({ page }) => {
  await stub(page, false);
  await page.goto("/projects/daily-revenue-pipeline/", { waitUntil: "networkidle" }); // client:idle hydration
  const button = page.getByRole("button", { name: "Ask about this project" });
  await button.click();
  const dialog = page.getByRole("dialog", { name: "Ask about Kareem" });
  await expect(dialog).toBeVisible();
  const title = await page.locator("h1").innerText();
  await expect(dialog.getByRole("log").locator("li").first()).toContainText(`"${title}"`);
  await expect(dialog.getByText("Hello from the stub.")).toBeVisible();
  await expect(button).toHaveAttribute("aria-expanded", "true");
});

test("a hero question sends its starter prompt once, even clicked again while open", async ({ page }) => {
  await stub(page, false);
  await page.goto("/", { waitUntil: "networkidle" });
  const chips = page.locator("header .ask [data-chat-prompt]");
  await expect(chips).toHaveCount(2);
  const prompt = await chips.first().getAttribute("data-chat-prompt");
  await chips.first().click();
  const dialog = page.getByRole("dialog", { name: "Ask about Kareem" });
  await expect(dialog.getByRole("log").locator("li").first()).toHaveText(prompt ?? "");
  await expect(dialog.getByText("Hello from the stub.")).toHaveCount(1);
});
