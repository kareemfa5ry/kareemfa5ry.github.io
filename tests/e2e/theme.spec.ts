import { expect, test, type Page } from "@playwright/test";

// Page background per theme (global.css --bg), as getComputedStyle reports it.
const LIGHT_BG = "rgb(247, 249, 252)";
const DARK_BG = "rgb(0, 8, 20)";

function pageBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.body).backgroundColor);
}

test("page follows the system theme when no choice is stored", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  expect(await pageBackground(page)).toBe(DARK_BG);
  await page.emulateMedia({ colorScheme: "light" });
  expect(await pageBackground(page)).toBe(LIGHT_BG);
});

test("theme switch changes the theme and keeps it after a reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const darkSwitch = page.getByRole("switch", { name: "Dark mode" });
  await expect(darkSwitch).not.toBeChecked();
  await page.locator(".plane-switch").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await pageBackground(page)).toBe(DARK_BG);

  await page.reload();
  expect(await pageBackground(page)).toBe(DARK_BG);
  await expect(darkSwitch).toBeChecked();
  await page.locator(".plane-switch").click();
  expect(await pageBackground(page)).toBe(LIGHT_BG);
});

test("theme switch works from the keyboard", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const darkSwitch = page.getByRole("switch", { name: "Dark mode" });
  await darkSwitch.focus();
  await expect(darkSwitch).toHaveAttribute("role", "switch");
  await expect(darkSwitch).toBeChecked();
  await page.keyboard.press("Space");
  await expect(darkSwitch).not.toBeChecked();
  expect(await pageBackground(page)).toBe(LIGHT_BG);
  await page.keyboard.press("Enter");
  await expect(darkSwitch).toBeChecked();
  expect(await pageBackground(page)).toBe(DARK_BG);
});

test("switch label is visible on wide screens and only in the accessible name on narrow ones", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/");
  await expect(page.locator(".plane-switch .label-text")).toBeVisible();
  await expect(page.getByRole("switch", { name: "Dark mode" })).toHaveAttribute("title", /light and dark/);
  await page.setViewportSize({ width: 390, height: 800 });
  const box = await page.locator(".plane-switch .label-text").boundingBox();
  expect(box?.width).toBeLessThanOrEqual(1);
  await expect(page.getByRole("switch", { name: "Dark mode" })).toBeAttached();
});
