// Home hero: three availability badges and the employers line.
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
