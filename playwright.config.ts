import { defineConfig, devices } from "@playwright/test";

/**
 * Accessibility browser suite. Assumes app is already running at baseURL
 * (CI starts `pnpm start` before tests).
 */
export default defineConfig({
  testDir: "tests/a11y",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  timeout: 60_000,
  webServer: process.env.PLAYWRIGHT_WEB_SERVER
    ? {
        command: process.env.PLAYWRIGHT_WEB_SERVER,
        url: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
});
