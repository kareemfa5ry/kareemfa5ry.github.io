import { expect, test } from "@playwright/test";

const PROJECTS = [
  "competitor-price-tracker",
  "customer-route-analytics-power-bi",
  "daily-revenue-pipeline",
  "operational-log-parser",
  "revenue-audit-engine",
];

test("home page has its title, nav links and four stat tiles", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Kareem Fakhry/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kareem Fakhry");
  for (const id of ["experience", "projects", "skills", "download"]) {
    await expect(page.locator(`nav a[href="#${id}"]`)).toBeVisible();
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.locator(".stats").first().locator(".stat")).toHaveCount(4);
});

test("home page links the five project pages", async ({ page }) => {
  await page.goto("/");
  for (const slug of PROJECTS) {
    await expect(page.locator(`#projects a[href="/projects/${slug}/"]`)).toHaveCount(1);
  }
});

test("home page logs no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});
