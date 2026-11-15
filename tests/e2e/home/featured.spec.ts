// Featured projects: the three with screenshots lead the Projects section with a real screenshot each.
import { expect, test } from "@playwright/test";

test("the first three projects each show a screenshot with alt text", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator("#projects [data-project]");
  for (let i = 0; i < 3; i++) {
    const shot = rows.nth(i).locator("img[srcset]").first();
    await expect(shot).toHaveAttribute("alt", /\S/);
    await expect(shot).toHaveAttribute("loading", "lazy");
  }
});
