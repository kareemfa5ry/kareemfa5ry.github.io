// Experience timeline: roles in an ordered list, dates in <time>, the current role says "Present".
import { expect, test } from "@playwright/test";

test("experience is an ordered list of 4 roles, the first one current", async ({ page }) => {
  await page.goto("/");
  const roles = page.locator("#experience ol.timeline > li");
  await expect(roles).toHaveCount(4);
  await expect(roles.first()).toContainText("Present");
  await expect(roles.first()).toHaveAttribute("aria-current", "date");
  expect(await roles.first().locator("time[datetime]").count()).toBeGreaterThanOrEqual(1);
});
