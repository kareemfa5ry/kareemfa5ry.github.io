// Hero globe: canvas on desktop (also with chat docked) without sideways scroll; a phone loads none of it.
import { expect, test, type Page } from "@playwright/test";

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

test("desktop shows the globe canvas and does not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator("[data-hero-globe] canvas")).toBeVisible({ timeout: 10_000 });
  expect(await noHorizontalScroll(page)).toBe(true);
});

test("desktop with the chat docked still does not scroll sideways", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await expect(page.locator("[data-hero-globe] canvas")).toBeVisible({ timeout: 10_000 });
  await page.locator(`button[aria-label="Ask about Kareem"]`).click();
  await page.getByRole("button", { name: "Dock to side" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-chat-dock", "side");
  expect(await noHorizontalScroll(page)).toBe(true);
});

test("phone loads no globe canvas, no three chunk, no land mask", async ({ page }) => {
  const paths: string[] = [];
  page.on("request", (request) => paths.push(new URL(request.url()).pathname.toLowerCase()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(3000);
  await expect(page.locator("[data-hero-globe] canvas")).toHaveCount(0);
  expect(
    paths.filter((p) => p.includes("three") || p.includes("globe_scene") || p.includes("/globe/land.png")),
  ).toEqual([]);
  expect(await noHorizontalScroll(page)).toBe(true);
});
