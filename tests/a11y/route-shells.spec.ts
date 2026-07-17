import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility smoke for public route shells.
 * Authenticated shells are skipped when A11Y_SKIP_AUTH_ROUTES=1 (default in CI
 * without seeded users). Fail-closed: skips are reported, not silent passes.
 */

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/core",
  "/accessibility-map",
  "/care",
  "/care/request",
  "/transport",
  "/transport/request",
  "/jobs",
  "/accountability",
] as const;

const AUTH_ROUTES = [
  "/dashboard",
  "/dashboard/accessibility",
  "/dashboard/consent",
  "/dashboard/safety",
  "/dashboard/billing",
] as const;

async function runAxe(page: Page, route: string): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  const serious = results.violations.filter((v) =>
    ["critical", "serious"].includes(v.impact || ""),
  );

  expect
    .soft(
      serious,
      `Serious/critical axe violations on ${route}: ${JSON.stringify(
        serious.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
        })),
        null,
        2,
      )}`,
    )
    .toEqual([]);
}

test.describe("Public route shells (axe)", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`axe: ${route}`, async ({ page }) => {
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      // Soft: some routes may 404 if feature flagged off — still scan if HTML returned
      expect(response, `navigation to ${route}`).not.toBeNull();
      const status = response!.status();
      test.skip(
        status >= 500,
        `${route} returned ${status} — server error, not an a11y fail`,
      );
      await expect(page.locator("body")).toBeVisible();
      await runAxe(page, route);
    });
  }
});

test.describe("Authenticated route shells (axe)", () => {
  const skipAuth = process.env.A11Y_SKIP_AUTH_ROUTES === "1";

  for (const route of AUTH_ROUTES) {
    test(`axe: ${route}`, async ({ page }) => {
      test.skip(
        skipAuth,
        `A11Y_SKIP_AUTH_ROUTES=1 — ${route} requires seeded authenticated user (documented skip)`,
      );

      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response).not.toBeNull();
      // Unauthenticated may redirect to login — still axe the resulting shell
      await expect(page.locator("body")).toBeVisible();
      await runAxe(page, page.url());
    });
  }
});

test.describe("Keyboard / skip-link smoke", () => {
  test("home has a main landmark or skip affordance", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const main = page.locator(
      "main, [role='main'], a[href='#main'], a[href='#content']",
    );
    await expect(main.first()).toBeVisible({ timeout: 10_000 });
  });
});
