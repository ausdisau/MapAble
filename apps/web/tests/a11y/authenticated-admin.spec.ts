import { test } from "@playwright/test";

import { assertAuthShell } from "./helpers/auth-a11y";

test.describe("admin journeys", () => {
  for (const route of ["/dashboard", "/dashboard/accessibility"] as const) {
    test(`shell ${route}`, async ({ page }) => {
      await assertAuthShell(page, route);
    });
  }
});
