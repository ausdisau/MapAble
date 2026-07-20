import { expect, test as setup } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

/**
 * Creates Playwright storage-state fixtures for canonical pilot roles.
 * Requires seeded users from `prisma/seed-a11y-pilot.ts` and TWILIO_2FA_ENABLED≠true.
 */

const authDir = path.join("tests/a11y/.auth");

const roles = [
  {
    id: "participant",
    email: "participant@mapable.test",
    password: "Password123!",
    file: path.join(authDir, "participant.json"),
  },
  {
    id: "provider",
    email: "provider@mapable.test",
    password: "Password123!",
    file: path.join(authDir, "provider.json"),
  },
  {
    id: "coordinator",
    email: "coordinator@mapable.test",
    password: "Password123!",
    file: path.join(authDir, "coordinator.json"),
  },
  {
    id: "admin",
    email: "admin@mapable.test",
    password: "Password123!",
    file: path.join(authDir, "admin.json"),
  },
] as const;

setup.beforeAll(() => {
  fs.mkdirSync(authDir, { recursive: true });
});

for (const role of roles) {
  setup(`authenticate ${role.id}`, async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await page.locator("#login-email").fill(role.email);
    await page.locator("#login-password").fill(role.password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 30_000,
    });
    expect(page.url()).not.toMatch(/\/login(?:\?|$)/);

    await page.context().storageState({ path: role.file });
  });
}
