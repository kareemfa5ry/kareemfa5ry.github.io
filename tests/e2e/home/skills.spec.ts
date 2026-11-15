// Skills: each group is a card of chips with links to the projects that prove it.
import { expect, test } from "@playwright/test";

test("a skill group shows chips and a link to a project page", async ({ page }) => {
  await page.goto("/");
  const group = page.locator("#sql-and-databases");
  await expect(group.locator(".chip")).toHaveCount(7);
  await expect(group.locator('a[href^="/projects/"]').first()).toBeVisible();
});
