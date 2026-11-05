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
  const lightSwitch = page.getByRole("switch", { name: "Light theme" });
  await expect(lightSwitch).toBeChecked();
  await page.locator(".plane-switch").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await pageBackground(page)).toBe(DARK_BG);

  await page.reload();
  expect(await pageBackground(page)).toBe(DARK_BG);
  await expect(lightSwitch).not.toBeChecked();
  await page.locator(".plane-switch").click();
  expect(await pageBackground(page)).toBe(LIGHT_BG);
});

test("theme switch works from the keyboard", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  const lightSwitch = page.getByRole("switch", { name: "Light theme" });
  await lightSwitch.focus();
  await page.keyboard.press("Space");
  await expect(lightSwitch).toBeChecked();
  expect(await pageBackground(page)).toBe(LIGHT_BG);
});
