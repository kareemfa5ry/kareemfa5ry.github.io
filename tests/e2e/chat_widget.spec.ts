// Floating chat launcher stays in view, opens, docks/undocks, minimizes (button, Escape), fills a phone viewport.
import { expect, test, type Page } from "@playwright/test";

const PROJECT = "/projects/daily-revenue-pipeline/";

async function viewportBox(page: Page, name: string) {
  const target =
    name === "dialog"
      ? page.getByRole("dialog", { name: "Ask about Kareem" })
      : page.locator(`button[aria-label="Ask about Kareem"]`);
  const box = await target.boundingBox();
  const size = page.viewportSize();
  if (!box || !size) throw new Error("no box or viewport");
  return { box, size };
}

async function openChat(page: Page) {
  await page.goto("/");
  const launcher = page.locator(`button[aria-label="Ask about Kareem"]`);
  await expect(launcher).toBeVisible();
  await page.waitForTimeout(500); // client:idle hydration
  await launcher.click();
  return launcher;
}

for (const path of ["/", PROJECT]) {
  test(`launcher is visible on ${path} and stays in the viewport after scrolling`, async ({ page }) => {
    await page.goto(path);
    await expect(page.locator(`button[aria-label="Ask about Kareem"]`)).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const { box, size } = await viewportBox(page, "button");
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height).toBeLessThanOrEqual(size.height);
    expect(box.x + box.width).toBeLessThanOrEqual(size.width);
  });
}

test("click opens the dialog with the question box focused", async ({ page }) => {
  await openChat(page);
  await expect(page.getByRole("dialog", { name: "Ask about Kareem" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Your question" })).toBeFocused();
  await expect(page.getByRole("dialog").locator('a[href^="mailto:"]')).toBeVisible();
});

test("dock makes the card full height and undock restores it", async ({ page }) => {
  await openChat(page);
  const height = async () => (await viewportBox(page, "dialog")).box.height;
  const viewport = page.viewportSize()?.height ?? 0;
  const floating = await height();
  expect(floating).toBeLessThan(viewport - 20);
  await page.getByRole("button", { name: "Dock to side" }).click();
  await expect.poll(height).toBeGreaterThanOrEqual(viewport - 1);
  await page.getByRole("button", { name: "Undock" }).click();
  await expect.poll(height).toBe(floating);
});

test("Minimize hides the dialog and returns focus to the launcher", async ({ page }) => {
  const launcher = await openChat(page);
  await page.getByRole("button", { name: "Minimize", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test("Escape minimizes", async ({ page }) => {
  const launcher = await openChat(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(launcher).toBeFocused();
});

test("at phone width the open dialog fills the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openChat(page);
  const { box } = await viewportBox(page, "dialog");
  expect(box).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
});

test("docked chat on desktop reserves its width: switch label clear of the panel, no horizontal scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openChat(page);
  await page.getByRole("button", { name: "Dock to side" }).click();
  const panel = (await viewportBox(page, "dialog")).box;
  await expect(page.locator("html")).toHaveAttribute("data-chat-dock", "side");
  const label = page.locator("label.plane-switch").first();
  const right = async () => {
    const box = await label.boundingBox();
    return (box?.x ?? 0) + (box?.width ?? 0);
  };
  await expect.poll(right).toBeLessThanOrEqual(1280 - panel.width + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("docked chat at phone width is a full-width sheet with no body padding", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openChat(page);
  await page.getByRole("button", { name: "Dock to side" }).click();
  const { box } = await viewportBox(page, "dialog");
  expect(box).toMatchObject({ x: 0, width: 390 });
  expect(await page.evaluate(() => getComputedStyle(document.body).paddingInlineEnd)).toBe("0px");
});
