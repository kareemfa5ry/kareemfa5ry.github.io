// Home page: title, nav links and sections, the hero stats, the five project links, no console errors.
import { expect, test } from "@playwright/test";

const PROJECTS = [
  "competitor-price-tracker",
  "customer-route-analytics-power-bi",
  "daily-revenue-pipeline",
  "operational-log-parser",
  "revenue-audit-engine",
];

test("home page has its title, nav links and no stat tiles below the hero", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Kareem Fakhry/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Kareem Fakhry");
  for (const id of ["experience", "projects", "skills", "download"]) {
    await expect(page.locator(`nav a[href="#${id}"]`)).toBeVisible();
    await expect(page.locator(`#${id}`)).toHaveCount(1);
  }
  await expect(page.locator(".stats")).toHaveCount(0);
});

test("home project posters follow the active theme", async ({ page }) => {
  await page.goto("/");
  const first = page.locator("#projects .poster").first();
  await expect(first.locator("img.only-light")).toBeVisible();
  await expect(first.locator("img.only-light")).toHaveAttribute("src", /\/poster\.jpg$/);
  await expect(first.locator("img.only-dark")).toBeHidden();
  await page.locator(".plane-switch").click();
  await expect(first.locator("img.only-dark")).toBeVisible();
  await expect(first.locator("img.only-dark")).toHaveAttribute("src", /\/poster-dark\.jpg$/);
  await expect(first.locator("img.only-light")).toBeHidden();
});

test("hero has a CV button per role, three proof numbers and availability", async ({ page }) => {
  await page.goto("/");
  const hero = page.locator("header").first();
  for (const role of ["Senior Data Analyst CV", "Revenue and Pricing Manager CV"]) {
    await expect(hero.getByRole("link", { name: role })).toHaveAttribute("href", /\.pdf$/);
  }
  await expect(hero.locator(".proof li")).toHaveCount(3);
  await expect(hero).toContainText("open to relocation");
  await expect(hero.getByRole("link", { name: "LinkedIn" })).toBeVisible();
});

test("hero Ask about Kareem opens the chat with the question box focused", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(500); // client:idle hydration
  await page.locator("header [data-chat-open]").click();
  await expect(page.getByRole("textbox", { name: "Your question" })).toBeFocused();
});

test("hero ask button toggles the chat and its label", async ({ page }) => {
  await page.goto("/");
  await page.waitForTimeout(500); // client:idle hydration
  const button = page.locator("header [data-chat-open]");
  const dialog = page.getByRole("dialog", { name: "Ask about Kareem" });
  await expect(button).toHaveText("Ask about Kareem", { useInnerText: true });
  await button.click();
  await expect(dialog).toBeVisible();
  await expect(button).toHaveText("Minimize the chat", { useInnerText: true });
  await expect(button).toHaveAttribute("aria-expanded", "true");
  // Opened from the hero it docks at the side, so the button is not under the card.
  await expect
    .poll(async () => (await button.boundingBox())!.x + (await button.boundingBox())!.width)
    .toBeLessThanOrEqual((await dialog.boundingBox())!.x);
  await button.click();
  await expect(dialog).toBeHidden();
  await expect(button).toHaveText("Ask about Kareem", { useInnerText: true });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await expect(button).toBeFocused();
  await button.click();
  await dialog.getByRole("button", { name: "Minimize", exact: true }).click();
  await expect(button).toHaveText("Ask about Kareem", { useInnerText: true });
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

test("each project card has a demo badge ending in seconds", async ({ page }) => {
  await page.goto("/");
  const badges = page.locator(".badge");
  await expect(badges).toHaveCount(PROJECTS.length);
  for (const text of await badges.allTextContents()) expect(text).toMatch(/^Watch the demo · \d+ s$/);
});
