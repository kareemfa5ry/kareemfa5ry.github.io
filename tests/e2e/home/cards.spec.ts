// Project cards and featured rows: summary, numbers, screenshots and headings on the home page.
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

test("the first three projects each show a screenshot with alt text", async ({ page }) => {
  await page.goto("/");
  const rows = page.locator("#projects [data-project]");
  for (let i = 0; i < 3; i++) {
    const shot = rows.nth(i).locator("img[srcset]").first();
    await expect(shot).toHaveAttribute("alt", /\S/);
    await expect(shot).toHaveAttribute("loading", "lazy");
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
