// Globe backdrop contrast: the weakest text token (--muted) keeps WCAG AA (4.5:1) over every colour the globe
// paints, blended over --bg at the opacity the layer has behind the text column, in both themes.
import { expect, test, type Page } from "@playwright/test";

type Rgb = [number, number, number];

const parse = (css: string): Rgb => {
  const [r, g, b] = css.match(/[\d.]+/g)?.map(Number) ?? [];
  return [r, g, b];
};
const blend = (top: Rgb, under: Rgb, alpha: number): Rgb =>
  top.map((c, i) => c * alpha + under[i] * (1 - alpha)) as Rgb;
const luminance = (rgb: Rgb) => {
  const [r, g, b] = rgb.map((c) => (c / 255 <= 0.04045 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: Rgb, b: Rgb) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** The globe's painted colours (its three probes), the layer's opacities, --bg and --muted, as computed. */
const readColours = (page: Page) =>
  page.evaluate(() => {
    const box = getComputedStyle(document.querySelector("[data-globe-box]") as Element);
    const layer = getComputedStyle(document.querySelector("[data-globe]") as Element);
    const probe = document.body.appendChild(document.createElement("span"));
    probe.style.color = "var(--muted)";
    const muted = getComputedStyle(probe).color;
    probe.remove();
    return {
      painted: [box.color, box.borderTopColor, box.outlineColor],
      opacity: parseFloat(layer.getPropertyValue("--globe-opacity")),
      column: parseFloat(layer.getPropertyValue("--globe-column")),
      bg: getComputedStyle(document.body).backgroundColor,
      muted,
    };
  });

for (const colorScheme of ["light", "dark"] as const) {
  test(`muted text keeps 4.5:1 over the globe in the ${colorScheme} theme`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    const colours = await readColours(page);
    expect(colours.column).toBeGreaterThan(0);
    expect(colours.column).toBeLessThanOrEqual(colours.opacity);
    const bg = parse(colours.bg);
    for (const painted of colours.painted) {
      const behindText = blend(parse(painted), bg, colours.column);
      expect(contrast(parse(colours.muted), behindText), `${painted} at ${colours.column}`).toBeGreaterThanOrEqual(4.5);
    }
  });
}
