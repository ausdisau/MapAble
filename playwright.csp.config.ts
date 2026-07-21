import { defineConfig, devices } from "@playwright/test";

/**
 * Flag-on CSP enforce smoke (local/CI only).
 *
 * Requires the app to be started with MAPABLE_CSP_ENFORCE_PREVIEW=true.
 * Does not claim Vercel Preview flag-on evidence (that remains NOT_RUN until
 * the account owner sets the Preview env var).
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";

export default defineConfig({
  testDir: "tests/csp",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    ...devices["Desktop Chrome"],
  },
  timeout: 90_000,
  webServer: process.env.PLAYWRIGHT_WEB_SERVER
    ? {
        command: process.env.PLAYWRIGHT_WEB_SERVER,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 240_000,
        env: {
          ...process.env,
          MAPABLE_CSP_ENFORCE_PREVIEW: "true",
          NODE_ENV: process.env.NODE_ENV || "production",
        },
      }
    : undefined,
  projects: [
    {
      name: "csp-enforce",
      testMatch: /csp-enforce-preview\.spec\.ts/,
    },
  ],
});
