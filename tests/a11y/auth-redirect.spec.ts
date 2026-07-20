import { expect, test } from "@playwright/test";

import { settle } from "./helpers/auth-a11y";

test("unauthenticated dashboard redirects to login", async ({ browser }) => {
  const context = await browser.newContext({ storageState: undefined });
  const page = await context.newPage();
  await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  await settle(page);
  expect(new URL(page.url()).pathname).toMatch(/^\/login/);
  await context.close();
});
