// Light and dark theme switch: where the visitor's choice is stored and the <html> attribute it sets.
// Read by components/theme/ThemeInit.astro (applies the choice before first paint) and ThemeToggle.astro.
// No stored choice means the page follows the system setting (global.css, color-scheme: light dark).
export const THEME_STORAGE_KEY = "theme";
export const THEME_ATTRIBUTE = "data-theme";
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export function isTheme(value: string | null): value is Theme {
  return THEMES.some((theme) => theme === value);
}
