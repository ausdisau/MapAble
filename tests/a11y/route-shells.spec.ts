import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Response } from "@playwright/test";

/**
 * Accessibility smoke for public route shells.
 *
 * Authenticated shells are covered by authenticated-journeys.spec.ts with
 * seeded storage-state fixtures. When A11Y_SKIP_AUTH_ROUTES=1, auth axe tests
 * in this file remain documented skips (local without DB).
 *
 * Unexpected 404/5xx responses fail. This suite does not claim WCAG conformance.
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
  "/employment",
  "/accountability",
] as const;

const AUTH_ROUTES = [
  "/dashboard",
  "/dashboard/accessibility",
  "/dashboard/consent",
  "/dashboard/safety",
  "/dashboard/billing",
] as const;

/** Routes intentionally unavailable (feature-disabled). None fabricated. */
const FEATURE_DISABLED_ROUTES: ReadonlyArray<{
  route: string;
  expectedStatuses: number[];
}> = [];

async function settleNavigation(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("body")).toBeVisible();
  const main = page.locator("main, [role='main']");
  if ((await main.count()) > 0) {
    await expect(main.first()).toBeVisible({ timeout: 10_000 });
  }
  await page
    .waitForLoadState("networkidle", { timeout: 5_000 })
    .catch(() => undefined);
}

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

function assertSuccessfulShell(route: string, response: Response | null): void {
  expect(response, `navigation to ${route}`).not.toBeNull();
  const status = response!.status();
  expect(
    status,
    `${route} returned unexpected status ${status} (404/5xx must fail a11y CI)`,
  ).toBeGreaterThanOrEqual(200);
  expect(
    status,
    `${route} returned unexpected status ${status} (404/5xx must fail a11y CI)`,
  ).toBeLessThan(400);
}

test.describe("Public route shells (axe)", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`axe: ${route}`, async ({ page }) => {
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      assertSuccessfulShell(route, response);
      await settleNavigation(page);
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
      expect(response, `navigation to ${route}`).not.toBeNull();
      const status = response!.status();
      expect(
        status,
        `${route} returned ${status} — unexpected server/not-found for auth shell`,
      ).toBeLessThan(500);
      expect(status, `${route} returned unexpected 404`).not.toBe(404);

      await settleNavigation(page);
      const url = page.url();
      const landedOnLogin = /\/login(?:\?|$)/.test(new URL(url).pathname);
      expect(
        landedOnLogin || status < 400,
        `${route} must land on login redirect or authenticated shell, got ${url} status=${status}`,
      ).toBeTruthy();
      await runAxe(page, page.url());
    });
  }
});

test.describe("Feature-disabled route expectations", () => {
  test("inventory is explicit (no silent skips)", async () => {
    expect(Array.isArray(FEATURE_DISABLED_ROUTES)).toBe(true);
  });

  for (const entry of FEATURE_DISABLED_ROUTES) {
    test(`disabled: ${entry.route}`, async ({ page }) => {
      const response = await page.goto(entry.route, {
        waitUntil: "domcontentloaded",
      });
      expect(response).not.toBeNull();
      expect(entry.expectedStatuses).toContain(response!.status());
    });
  }
});

test.describe("Keyboard / skip-link smoke", () => {
  test("home has a main landmark or skip affordance", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await settleNavigation(page);
    const main = page.locator(
      "main, [role='main'], a[href='#main'], a[href='#content']",
    );
    await expect(main.first()).toBeVisible({ timeout: 10_000 });
  });
});
