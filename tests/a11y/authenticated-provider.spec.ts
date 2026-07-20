import { test } from "@playwright/test";

import { assertAuthShell } from "./helpers/auth-a11y";

test.describe("provider journeys", () => {
  for (const route of ["/provider", "/dashboard"] as const) {
    test(`shell ${route}`, async ({ page }) => {
      await assertAuthShell(page, route);
    });
  }
});
