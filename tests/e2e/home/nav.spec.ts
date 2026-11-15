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

test("nav fits a 360px phone without sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto("/");
  for (const item of await page.locator("nav a, nav .plane-switch").all()) {
    const box = await item.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
});
