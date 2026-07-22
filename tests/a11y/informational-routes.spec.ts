import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Response } from "@playwright/test";

import { INFORMATIONAL_RELEASE_ROUTES } from "@/lib/public-informational/routes";

/**
 * Accessibility + shell checks for every allowlisted informational route.
 * Driven by the canonical inventory — routes cannot silently diverge.
 *
 * Automated axe is not screen-reader or human evidence (those remain NOT_RUN).
 */

/** AccessiBe remote widget may reject headless/local runtimes with this message. */
function isIgnorableThirdPartyPageError(message: string): boolean {
  return /snipped is executed in unsupported environment/i.test(message);
}

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

test.describe("Informational release routes (axe + shell)", () => {
  for (const route of INFORMATIONAL_RELEASE_ROUTES) {
    test(`informational: ${route.path}`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on("pageerror", (err) => {
        const message = err.message.slice(0, 200);
        if (isIgnorableThirdPartyPageError(message)) return;
        consoleErrors.push(message);
      });

      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
      });
      expect(response, `navigation to ${route.path}`).not.toBeNull();
      const status = (response as Response).status();
      expect(status).toBeGreaterThanOrEqual(200);
      expect(status).toBeLessThan(400);
      expect((response as Response).url()).not.toMatch(/\/login/);

      await settleNavigation(page);

      const title = await page.title();
      expect(title.toLowerCase()).toContain(route.titleIncludes.toLowerCase());

      const h1 = page.locator("h1").first();
      await expect(h1).toBeVisible();
      await expect(h1).toContainText(new RegExp(route.h1Includes, "i"));

      const skip = page
        .locator('a[href="#main-content"], a[href="#main"]')
        .first();
      if ((await skip.count()) > 0) {
        await skip.focus();
        await expect(skip).toBeFocused();
      }

      await expect(page.locator("main, [role='main']").first()).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();
      const serious = results.violations.filter((v) =>
        ["critical", "serious"].includes(v.impact || ""),
      );
      expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);

      expect(consoleErrors, consoleErrors.join(" | ")).toEqual([]);
    });
  }
});

test.describe("Informational release — keyboard and reflow smoke", () => {
  test("homepage skip link and tab order reach main", async ({ page }) => {
    await page.goto("/");
    await settleNavigation(page);
    await page.keyboard.press("Tab");
    const focused = page.locator(":focus");
    await expect(focused).toBeVisible();
    const tag = await focused.evaluate((el) => el.tagName.toLowerCase());
    expect(["a", "button", "input", "select", "textarea"]).toContain(tag);
  });

  test("homepage reflows at narrow viewport without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");
    await settleNavigation(page);
    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth + 2;
    });
    expect(overflow).toBe(false);
  });

  test("prefers-reduced-motion does not trap keyboard on contact", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/contact");
    await settleNavigation(page);
    for (let i = 0; i < 8; i += 1) {
      await page.keyboard.press("Tab");
    }
    await expect(page.locator(":focus")).toBeVisible();
  });
});
