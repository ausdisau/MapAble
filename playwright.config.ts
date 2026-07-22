import { defineConfig, devices, type Project } from "@playwright/test";

/**
 * Accessibility browser suite.
 * CI seeds pilot users, builds the app, then runs setup + public/auth projects.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const skipAuth = process.env.A11Y_SKIP_AUTH_ROUTES === "1";

const projects: Project[] = [
  {
    name: "public",
    testMatch: /route-shells\.spec\.ts/,
  },
  {
    name: "informational",
    testMatch: /informational-routes\.spec\.ts/,
  },
  {
    name: "informational-boundary",
    testMatch: /informational-boundary\.spec\.ts/,
  },
];

if (!skipAuth) {
  projects.unshift({
    name: "setup",
    testMatch: /auth\.setup\.ts/,
  });
  projects.push(
    {
      name: "auth-redirect",
      testMatch: /auth-redirect\.spec\.ts/,
      dependencies: ["setup"],
    },
    {
      name: "participant",
      testMatch: /authenticated-participant\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "tests/a11y/.auth/participant.json" },
    },
    {
      name: "provider",
      testMatch: /authenticated-provider\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "tests/a11y/.auth/provider.json" },
    },
    {
      name: "coordinator",
      testMatch: /authenticated-coordinator\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "tests/a11y/.auth/coordinator.json" },
    },
    {
      name: "admin",
      testMatch: /authenticated-admin\.spec\.ts/,
      dependencies: ["setup"],
      use: { storageState: "tests/a11y/.auth/admin.json" },
    },
  );
}

export default defineConfig({
  testDir: "tests/a11y",
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
  timeout: 60_000,
  webServer: process.env.PLAYWRIGHT_WEB_SERVER
    ? {
        command: process.env.PLAYWRIGHT_WEB_SERVER,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      }
    : undefined,
  projects,
});
