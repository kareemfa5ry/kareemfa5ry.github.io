// Playwright smoke tests of the built site (tests/e2e). Serves dist/ with `npm run preview`; build first.
import { defineConfig, devices } from "@playwright/test";

// Only `process.env` is used; declared here so the config type-checks without adding @types/node.
declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  testDir: "tests/e2e",
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: { baseURL: "http://localhost:4321", trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run preview -- --port 4321",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});
