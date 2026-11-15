// Scroll reveal: reduced motion and no-JS both show content in place, with no animation.
import { expect, test } from "@playwright/test";

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("a below-the-fold reveal is fully visible and not animated", async ({ page }) => {
    await page.goto("/");
    const card = page.locator(".reveal").last();
    await expect(card).toHaveCSS("opacity", "1");
    await expect(card).toHaveCSS("animation-name", "none");
  });
});

test.describe("no JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  test("every section's text is visible", async ({ page }) => {
    await page.goto("/");
    for (const section of await page.locator("main section").all()) {
      await expect(section.locator("h2").first()).toBeVisible();
    }
    for (const el of await page.locator(".reveal").all()) {
      await expect(el).toHaveCSS("opacity", "1");
    }
  });
});
