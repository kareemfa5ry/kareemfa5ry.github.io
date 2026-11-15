// Roles link to the project pages built in them; the role links live in #experience, not #projects.
import { expect, test } from "@playwright/test";

const links = (role: string) => `#experience ol.timeline > li:has(h3:text("${role}")) a[href^="/projects/"]`;

test("the consultant role links 3 projects, Revenue Manager 2, Nile Air none", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(links("Data and AI Consultant"))).toHaveCount(3);
  await expect(page.locator(links("Revenue Manager · Nesma"))).toHaveCount(2);
  await expect(page.locator(links("Head of Revenue"))).toHaveCount(0);
});
