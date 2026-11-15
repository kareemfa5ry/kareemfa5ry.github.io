// With reduced motion the result chart shows its final state: no transform or animation on the after dot.
import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test("reduced motion shows the final result chart", async ({ page }) => {
  await page.goto("/projects/operational-log-parser/");
  const chart = page.locator(".results svg").first();
  await expect(chart).toBeVisible();
  const after = chart.locator("circle.after");
  await expect(after).toHaveCSS("animation-name", "none");
  await expect(after).toHaveCSS("transform", "none");
});
