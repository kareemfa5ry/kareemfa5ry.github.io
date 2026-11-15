// A project page shows its pipeline stages as an ordered list, from the demo spec.
import { expect, test } from "@playwright/test";

test("a project page lists its pipeline stages in order", async ({ page }) => {
  await page.goto("/projects/operational-log-parser/");
  const stages = page.locator("section.pipeline ol li");
  await expect(stages).toHaveCount(4);
  await expect(stages.first()).toContainText("Raw operational logs");
  await expect(page.getByRole("list", { name: /4 steps/ })).toBeVisible();
});
