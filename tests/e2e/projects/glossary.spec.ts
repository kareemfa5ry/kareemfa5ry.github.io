// An airline term in a bullet opens a plain-words definition on tap and closes on Escape.
import { expect, test } from "@playwright/test";

test("tapping ATPCO shows its definition; Escape hides it", async ({ page }) => {
  await page.goto("/");
  const term = page.getByRole("button", { name: "ATPCO" }).first();
  const def = page.locator(`#${await term.getAttribute("popovertarget")}`);
  await expect(def).toBeHidden();
  await term.click();
  await expect(def).toBeVisible();
  await expect(def).toContainText("fares");
  await page.keyboard.press("Escape");
  await expect(def).toBeHidden();
});
