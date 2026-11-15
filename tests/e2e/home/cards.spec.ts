// Project cards: summary and headline numbers on the home page, bullets only on the project page.
import { expect, test } from "@playwright/test";

test("each project card shows a summary, at most two numbers and no bullet list", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("#projects [data-project]");
  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of await cards.all()) {
    await expect(card.locator(".summary")).not.toBeEmpty();
    expect(await card.locator(".metric-chips li").count()).toBeLessThanOrEqual(2);
    await expect(card.locator("ul:not(.metric-chips)")).toHaveCount(0);
  }
});
