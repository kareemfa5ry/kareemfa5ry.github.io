// Project cards and featured rows: summary, numbers, one picture each and headings on the home page.
import { expect, test } from "@playwright/test";

test("each project card shows a summary, at most two numbers and no bullet list", async ({ page }) => {
  await page.goto("/");
  const cards = page.locator("#projects [data-project]");
  expect(await cards.count()).toBeGreaterThan(0);
  for (const card of await cards.all()) {
    await expect(card.locator(".summary")).not.toBeEmpty();
    expect(await card.locator(".metric-chips li").count()).toBeLessThanOrEqual(2);
    await expect(card.locator("ul:not(.metric-chips)")).toHaveCount(0);
  }
});

test("the first three projects each show one picture (demo poster or screenshot) with alt text", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator("#projects [data-project]");
  for (let i = 0; i < 3; i++) {
    const pictures = rows.nth(i).locator("img:visible");
    await expect(pictures).toHaveCount(1);
    await expect(pictures).toHaveAttribute("alt", /\S/);
    await expect(pictures).toHaveAttribute("loading", "lazy");
  }
});

test("metric chips hold their final value in the server HTML and under reduced motion", async ({
  page,
  browser,
  baseURL,
}) => {
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const response = await noJs.request.get(baseURL ?? "/");
  const html = await response.text();
  await noJs.close();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const chip = page.locator(".metric-chips [data-count-up]").first();
  const final = (await chip.textContent()) ?? "";
  expect(final).toMatch(/\d/);
  expect(html).toContain(`>${final}</strong>`);
  await chip.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await expect(chip).toHaveText(final);
});

test("the projects section has no heading level 2 besides its own", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#projects h2")).toHaveCount(1);
});

test("clicking a poster plays the demo in place and Esc restores the poster", async ({ page }) => {
  await page.goto("/");
  const slug = await page
    .locator("#projects .poster")
    .first()
    .evaluate((el) => el.closest("[data-project]")!.getAttribute("data-project")!);
  const card = page.locator(`#projects [data-project="${slug}"]`);
  await expect(card.locator("iframe")).toHaveCount(0);
  await card.locator(".poster").click();
  await expect(card.locator('iframe[src^="/demos/"]')).toHaveCount(1);
  await expect(page).toHaveURL(/\/$/);
  await page.keyboard.press("Escape");
  await expect(card.locator("iframe")).toHaveCount(0);
  await expect(card.locator(".poster")).toBeFocused();
});
