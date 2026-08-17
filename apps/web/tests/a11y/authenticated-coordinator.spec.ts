import { test } from "@playwright/test";

import { assertAuthShell } from "./helpers/auth-a11y";

test.describe("coordinator journeys", () => {
  for (const route of ["/support-coordinator", "/dashboard"] as const) {
    test(`shell ${route}`, async ({ page }) => {
      await assertAuthShell(page, route);
    });
  }
});
