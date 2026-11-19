// Phone basics: the browser bar colour matches the page in both themes, and the stand-alone links on a project
// page (back link, demo full screen) are 44px tap targets.
import { expect, test } from "@playwright/test";

const PHONE = { width: 390, height: 844 };

for (const colorScheme of ["light", "dark"] as const) {
  test(`theme-color matches the page background in the ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize(PHONE);
    await page.goto("/");
    const { meta, bg } = await page.evaluate(() => {
      const active = [...document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')].find(
        (m) => matchMedia(m.media).matches,
      );
      const probe = document.body.appendChild(document.createElement("span"));
      probe.style.color = active?.content ?? "";
      const meta = getComputedStyle(probe).color;
      probe.remove();
      return { meta, bg: getComputedStyle(document.body).backgroundColor };
    });
    expect(meta).toBe(bg);
  });
}

test("project page links on their own line are 44px tap targets", async ({ page }) => {
  await page.setViewportSize(PHONE);
  await page.goto("/projects/operational-log-parser/");
  for (const name of ["← All projects", "Open full screen"]) {
    const box = await page.getByRole("link", { name }).first().boundingBox();
    expect(box?.height, name).toBeGreaterThanOrEqual(44);
  }
});
