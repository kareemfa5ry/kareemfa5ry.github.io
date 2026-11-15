// Refreshed look: every home section heading is visible and its accessible name carries no counter number.
import { expect, test } from "@playwright/test";

test("home h2 headings are visible and the section number is not in their accessible name", async ({ page }) => {
  await page.goto("/");
  const headings = page.locator("main h2");
  expect(await headings.count()).toBeGreaterThanOrEqual(5);
  for (const heading of await headings.all()) {
    await expect(heading).toBeVisible();
    const text = (await heading.textContent())?.trim() ?? "";
    await expect(page.getByRole("heading", { level: 2, name: text, exact: true })).toHaveCount(1);
  }
  const first = await headings.first().evaluate((el) => getComputedStyle(el, "::before").content);
  expect(first).toContain("counter(section");
});

test("a project page h2 keeps the type scale but has no section number", async ({ page }) => {
  await page.goto("/projects/customer-route-analytics-power-bi/");
  const heading = page.locator("main section > h2").first();
  await expect(heading).toBeVisible();
  expect(await heading.evaluate((el) => getComputedStyle(el, "::before").content)).toBe("none");
});
