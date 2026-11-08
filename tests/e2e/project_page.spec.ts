// A project page renders its h1 and back link, and draws the Results chart SVG.
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

test("a project with a demo embeds it in a reserved 16:9 box", async ({ page }) => {
  await page.goto("/projects/operational-log-parser/");
  const frame = page.locator("#demo iframe");
  await expect(frame).toHaveAttribute("title", "Animated walkthrough: Operational log parser and revenue checks");
  await expect(page.locator("#demo .frame")).toHaveCSS("aspect-ratio", "16 / 9");
});
