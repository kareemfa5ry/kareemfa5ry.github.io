import { expect, test } from "@playwright/test";

test("a project page renders its heading and links back to the list", async ({ page }) => {
  await page.goto("/projects/daily-revenue-pipeline/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Daily revenue data pipeline");
  const back = page.getByRole("link", { name: /All projects/ });
  await expect(back).toHaveAttribute("href", "/#projects");
  await back.click();
  await expect(page).toHaveURL(/\/#projects$/);
});

test("a project with results draws the chart SVG", async ({ page }) => {
  await page.goto("/projects/operational-log-parser/");
  await expect(page.locator("section.results svg").first()).toBeVisible();
});
