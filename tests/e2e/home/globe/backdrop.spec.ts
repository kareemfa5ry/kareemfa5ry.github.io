// Globe backdrop: one fixed canvas centred on the page content (also with the chat docked), on the home page and
// a project page, without sideways scroll; hidden in print; a phone loads none of it.
import { expect, test, type Page } from "@playwright/test";

const CANVAS = "[data-globe] canvas";

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

/** Horizontal distance between the canvas centre and the centre of the body's content box (dock padding out). */
const offCentre = (page: Page) =>
  page.evaluate((selector) => {
    const canvas = document.querySelector(selector)?.getBoundingClientRect();
    const body = document.body.getBoundingClientRect();
    const end = body.right - parseFloat(getComputedStyle(document.body).paddingInlineEnd);
    return canvas ? Math.abs(canvas.left + canvas.width / 2 - (body.left + end) / 2) : Infinity;
  }, CANVAS);

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
});

test("desktop shows one fixed, centred globe canvas and does not scroll sideways", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CANVAS)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  await expect(page.locator("[data-globe]")).toHaveCSS("position", "fixed");
  expect(await offCentre(page)).toBeLessThanOrEqual(2);
  expect(await noHorizontalScroll(page)).toBe(true);
});

test("desktop with the chat docked keeps the globe centred and does not scroll sideways", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CANVAS)).toBeVisible({ timeout: 10_000 });
  await page.locator(`button[aria-label="Ask about Kareem"]`).click();
  await page.getByRole("button", { name: "Dock to side" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-chat-dock", "side");
  await expect.poll(() => offCentre(page)).toBeLessThanOrEqual(2);
  expect(await noHorizontalScroll(page)).toBe(true);
});

test("a project page has the live globe too", async ({ page }) => {
  await page.goto("/projects/operational-log-parser/");
  await expect(page.locator(CANVAS)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(await noHorizontalScroll(page)).toBe(true);
});

test("print hides the globe", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(CANVAS)).toBeVisible({ timeout: 10_000 });
  await page.emulateMedia({ media: "print" });
  await expect(page.locator("[data-globe]")).toBeHidden();
});

test("phone loads no globe canvas, no three chunk, no land mask", async ({ page }) => {
  const paths: string[] = [];
  page.on("request", (request) => paths.push(new URL(request.url()).pathname.toLowerCase()));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.waitForLoadState("load");
  await page.waitForTimeout(3000);
  await expect(page.locator(CANVAS)).toHaveCount(0);
  expect(
    paths.filter((p) => p.includes("three") || p.includes("globe_scene") || p.includes("/globe/land.png")),
  ).toEqual([]);
  expect(await noHorizontalScroll(page)).toBe(true);
});
