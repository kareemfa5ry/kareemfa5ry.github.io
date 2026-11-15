// Home hero: three availability badges, the employers line and no results chart.
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

test("the before and after chart sits in the Nesma role, not in the hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("header").first().locator(".results")).toHaveCount(0);
  const results = page.locator("#experience .results");
  await expect(results).toHaveCount(1);
  await expect(results).toContainText("1.6");
  await expect(results).toContainText("5.0");
});
