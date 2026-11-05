import { expect, test } from "@playwright/test";

const chipsOf = (page: import("@playwright/test").Page) =>
  page.getByRole("group", { name: "Filter projects by skill" }).getByRole("button");

test("a skill chip hides projects, and a second click restores them", async ({ page }) => {
  await page.goto("/");
  const chip = chipsOf(page).first();
  const hidden = page.locator("[data-project][hidden]");
  await expect(chip).toBeVisible();
  await expect(hidden).toHaveCount(0);

  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  expect(await hidden.count()).toBeGreaterThan(0);

  await chip.click();
  await expect(hidden).toHaveCount(0);
});

test("the Enter key toggles a chip", async ({ page }) => {
  await page.goto("/");
  const chip = chipsOf(page).first();
  await expect(chip).toBeVisible();
  await chip.focus();
  await page.keyboard.press("Enter");
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter");
  await expect(chip).toHaveAttribute("aria-pressed", "false");
});
