// A project screenshot opens full size in a dialog; Escape closes it and focus returns to the link.
import { expect, test } from "@playwright/test";

test("a screenshot opens in a lightbox and Escape returns focus to it", async ({ page }) => {
  await page.goto("/projects/customer-route-analytics-power-bi/");
  const link = page.locator(".gallery figure a").first();
  await expect(link).toHaveAttribute("href", /.+/);
  await link.click();
  const box = page.locator("dialog.lightbox");
  await expect(box).toBeVisible();
  await expect(box.locator("img")).toHaveAttribute("src", /.+/);
  await page.keyboard.press("Escape");
  await expect(box).toBeHidden();
  await expect(link).toBeFocused();
});
