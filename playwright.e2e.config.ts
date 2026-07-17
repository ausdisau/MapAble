import { defineConfig, devices } from "@playwright/test";

/**
 * Starting Work / productisation e2e. Separate from a11y suite.
 * Enable pilot flags on the webServer env.
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
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
        env: {
          ...process.env,
          MAPABLE_STARTING_WORK_PILOT_ENABLED: "true",
          MAPABLE_STARTING_WORK_SYNTHETIC_ONLY: "true",
          MAPABLE_STARTING_WORK_DB_PERSISTENCE_ENABLED:
            process.env.MAPABLE_STARTING_WORK_DB_PERSISTENCE_ENABLED ?? "false",
        },
      }
    : undefined,
});
