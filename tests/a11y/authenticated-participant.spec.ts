import { expect, test } from "@playwright/test";

import {
  assertAuthShell,
  expectMainLandmark,
  expectVisibleFocus,
  settle,
} from "./helpers/auth-a11y";

test.describe("participant journeys", () => {
  for (const route of [
    "/dashboard",
    "/dashboard/accessibility",
    "/dashboard/consent",
    "/dashboard/safety",
    "/dashboard/billing",
  ] as const) {
    test(`shell ${route}`, async ({ page }) => {
      await assertAuthShell(page, route);
    });
  }

  test("keyboard-only tab reaches interactive control", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await settle(page);
    await expectVisibleFocus(page);
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press("Tab");
    }
    const tag = await page.evaluate(
      () => document.activeElement?.tagName?.toLowerCase() ?? "",
    );
    expect(["a", "button", "input", "select", "textarea"]).toContain(tag);
  });

  test("200% and 400% zoom reflow keeps main visible", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await settle(page);
    for (const width of [640, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator("main, [role='main']").first()).toBeVisible();
      const overflowX = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 40,
      );
      expect
        .soft(overflowX, `excessive horizontal overflow at width=${width}`)
        .toBeFalsy();
    }
  });

  test("reduced-motion preference does not crash shell", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await settle(page);
    await expectMainLandmark(page);
  });
});
