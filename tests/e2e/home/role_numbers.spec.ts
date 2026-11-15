// Each role leads with two headline-number chips under its title.
import { expect, test } from "@playwright/test";

test("each of the 4 roles shows 2 metric chips, the Revenue Manager one USD 1.5M", async ({ page }) => {
  await page.goto("/");
  const roles = page.locator("#experience ol.timeline > li");
  await expect(roles).toHaveCount(4);
  for (let i = 0; i < 4; i++) {
    await expect(roles.nth(i).locator(".metric-chips li")).toHaveCount(2);
  }
  await expect(roles.filter({ hasText: "Revenue Manager · Nesma" })).toContainText("USD 1.5M");
});
