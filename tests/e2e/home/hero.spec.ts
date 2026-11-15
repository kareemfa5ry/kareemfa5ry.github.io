// Home hero: three availability badges, the employers line and the before and after chart.
import { expect, test } from "@playwright/test";

test("hero shows three badges and names the employers", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("header").first();
  await expect(hero.locator(".badges li")).toHaveCount(3);
  const employers = hero.locator(".employers");
  for (const name of ["Nesma Airlines", "Nile Air", "Air Arabia"]) {
    await expect(employers).toContainText(name);
  }
});

test("hero charts the two percentage results, not the revenue its tiles show, and the roles repeat none", async ({
  page,
}) => {
  await page.goto("/");
  const results = page.locator("header").first().locator(".results");
  await expect(results.locator(".row")).toHaveCount(2);
  await expect(results).toContainText("71% → 81%");
  await expect(results).toContainText("66%");
  await expect(results).not.toContainText("USD M");
  await expect(page.locator("#experience .results")).toHaveCount(0);
});
