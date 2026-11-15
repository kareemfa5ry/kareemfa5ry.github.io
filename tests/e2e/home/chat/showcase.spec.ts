// Chat showcase: a band under the hero with a sample answer, the only question chips, and a typed-in reveal.
import { expect, test } from "@playwright/test";
import { CHAT_SHOWCASE } from "../../../../src/site/chat";

test("the band sits right under the hero, the hero has no chip row, and the full answer is in the DOM", async ({
  page,
}) => {
  await page.goto("/");
  const band = page.locator(".showcase");
  await expect(band).toHaveCount(1);
  await expect(band.getByRole("heading", { name: "Ask an AI about Kareem" })).toBeVisible();
  await expect(band.locator(".q")).toHaveText(CHAT_SHOWCASE.question);
  await expect(band.locator(".full")).toHaveText(CHAT_SHOWCASE.answer);
  await expect(band.locator(".chip")).toHaveCount(2);
  await expect(band.getByRole("button", { name: "Ask your own" })).toBeVisible();
  await expect(page.locator("header [data-chat-prompt]")).toHaveCount(0);
  await expect(page.locator("header .ask")).toHaveCount(0);
  await expect(page.locator("main > section").first()).toHaveClass(/showcase/);
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("the answer shows in full at once, with no typed copy", async ({ page }) => {
    await page.goto("/");
    const answer = page.locator(".showcase .a");
    await expect(answer).not.toHaveAttribute("data-typing", /.*/);
    await expect(answer.locator(".full")).toBeVisible();
    await expect(answer.locator(".full")).toHaveCSS("opacity", "1");
    await expect(answer.locator(".typed")).toBeHidden();
  });
});

test.describe("no JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("the answer shows in full", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".showcase .full")).toBeVisible();
    await expect(page.locator(".showcase .full")).toHaveCSS("opacity", "1");
  });
});
