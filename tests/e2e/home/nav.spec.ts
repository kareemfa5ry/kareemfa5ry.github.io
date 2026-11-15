// Nav: the link of the section in view gets aria-current, the CV link is a button.
import { expect, test } from "@playwright/test";

test("nav marks the section being read", async ({ page }) => {
  await page.goto("/");
  await page.locator("#skills").scrollIntoViewIfNeeded();
  await expect(page.locator('nav a[href="#skills"]')).toHaveAttribute("aria-current", "location");
  await expect(page.locator('nav a[aria-current="location"]')).toHaveCount(1);
});

test("nav CV link is a button", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('nav a[href="#download"]')).toHaveClass(/btn/);
});
