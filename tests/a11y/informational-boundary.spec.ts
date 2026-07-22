import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Response } from "@playwright/test";

import {
  EXCLUDED_TRANSACTIONAL_PATH_PREFIXES,
  INFORMATIONAL_RELEASE_ROUTES,
  INFORMATIONAL_SAFE_CTAS,
  isExcludedTransactionalPath,
  isInformationalReleasePath,
} from "@/lib/public-informational/routes";

/**
 * Runtime informational release-boundary suite.
 * Driven solely by `INFORMATIONAL_RELEASE_ROUTES` — no second hard-coded list.
 *
 * Expects the repository production build served via `pnpm start`
 * (`PLAYWRIGHT_WEB_SERVER`), not `next dev`.
 */

const APEX = "https://mapable.com.au";

const FORBIDDEN_AVAILABILITY =
  /\b(book\s+transport|book\s+support|request\s+support\s+worker|worker\s+matching|claims?\s+now|available\s+now\s+for\s+bookings?)\b/i;

const EXCLUDED_LINK_RE =
  /logout|sign-out|download|\.pdf$|\.csv$|mailto:|tel:|javascript:/i;

/** AccessiBe remote widget may reject headless/local runtimes with this message. */
function isIgnorableThirdPartyPageError(message: string): boolean {
  return /snipped is executed in unsupported environment/i.test(message);
}

async function settle(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await expect(page.locator("body")).toBeVisible();
  await page
    .waitForLoadState("networkidle", { timeout: 5_000 })
    .catch(() => undefined);
}

function assertHtmlOk(route: string, response: Response | null): void {
  expect(response, `navigation to ${route}`).not.toBeNull();
  const status = response!.status();
  expect(status, `${route} status`).toBeGreaterThanOrEqual(200);
  expect(status, `${route} status`).toBeLessThan(400);
  const type = response!.headers()["content-type"] || "";
  expect(type, `${route} content-type`).toMatch(/text\/html/i);
  expect(response!.url()).not.toMatch(/\/login(\?|$)/);
}

test.describe("Informational runtime boundary", () => {
  for (const route of INFORMATIONAL_RELEASE_ROUTES) {
    test(`boundary: ${route.path}`, async ({ page }) => {
      const pageErrors: string[] = [];
      const failedCritical: string[] = [];
      page.on("pageerror", (err) => {
        const message = err.message.slice(0, 200);
        if (isIgnorableThirdPartyPageError(message)) return;
        pageErrors.push(message);
      });
      page.on("response", (res) => {
        const url = res.url();
        const status = res.status();
        if (status < 400) return;
        if (
          /\.(css|js|woff2?|png|jpe?g|webp|svg|ico)(\?|$)/i.test(url) ||
          res.request().resourceType() === "document"
        ) {
          failedCritical.push(`${status} ${url.slice(0, 160)}`);
        }
      });

      const response = await page.goto(route.path, {
        waitUntil: "domcontentloaded",
      });
      assertHtmlOk(route.path, response);
      await settle(page);

      if (route.authenticationProhibited) {
        expect(page.url()).not.toMatch(/\/login(\?|$)/);
      }

      const title = await page.title();
      expect(title.toLowerCase()).toContain(route.titleIncludes.toLowerCase());

      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);
      await expect(h1.first()).toContainText(new RegExp(route.h1Includes, "i"));

      const canonical = page.locator('link[rel="canonical"]');
      await expect(canonical).toHaveCount(1);
      const href = await canonical.first().getAttribute("href");
      expect(href).toBeTruthy();
      expect(href!).toMatch(/^https:\/\/mapable\.com\.au(\/|$)/);
      expect(href!).not.toMatch(/localhost|127\.0\.0\.1|vercel\.app|preview/i);
      const expectedPath = route.path === "/" ? "/" : route.path;
      expect(new URL(href!).pathname.replace(/\/$/, "") || "/").toBe(
        expectedPath === "/" ? "/" : expectedPath,
      );

      const forms = page.locator("form");
      const formCount = await forms.count();
      if (!route.formsPermitted) {
        expect(formCount, `${route.path} must not expose forms`).toBe(0);
      } else {
        expect(formCount).toBeGreaterThan(0);
        const form = forms.first();
        const method = (await form.getAttribute("method")) || "get";
        expect(["get", "post"]).toContain(method.toLowerCase());
        // Contact / PII intake forms require visible privacy/consent context.
        // Homepage guided search is GET discovery only — labels still required.
        if (route.path === "/contact" || method.toLowerCase() === "post") {
          await expect(
            page
              .getByText(/privacy|do not include|NDIS plan|sensitive/i)
              .first(),
          ).toBeVisible();
        }
        const labeledControls = form.locator(
          "input:not([type='hidden']):not([type='submit']), select, textarea",
        );
        const controlCount = await labeledControls.count();
        expect(controlCount).toBeGreaterThan(0);
        for (let i = 0; i < controlCount; i += 1) {
          const control = labeledControls.nth(i);
          const id = await control.getAttribute("id");
          const aria = await control.getAttribute("aria-label");
          const ariaLabelledBy = await control.getAttribute("aria-labelledby");
          const hasLabel =
            Boolean(aria) ||
            Boolean(ariaLabelledBy) ||
            (id
              ? (await page.locator(`label[for="${id}"]`).count()) > 0
              : false);
          expect(hasLabel, `control ${i} on ${route.path}`).toBe(true);
        }
      }

      const bodyText = await page.locator("body").innerText();
      expect(bodyText).not.toMatch(FORBIDDEN_AVAILABILITY);

      const anchors = page.locator("a[href]");
      const count = await anchors.count();
      const internalHrefs: string[] = [];
      for (let i = 0; i < Math.min(count, 80); i += 1) {
        const raw = (await anchors.nth(i).getAttribute("href")) || "";
        if (!raw || EXCLUDED_LINK_RE.test(raw) || raw.startsWith("#")) continue;
        if (raw.startsWith("http") && !raw.includes("mapable.com.au")) continue;
        let path = raw;
        try {
          path = raw.startsWith("http")
            ? new URL(raw).pathname
            : raw.split("?")[0] || raw;
        } catch {
          continue;
        }
        if (!path.startsWith("/")) continue;
        if (isExcludedTransactionalPath(path)) {
          // Informational pages must not deep-link into excluded transactional surfaces.
          expect(
            INFORMATIONAL_SAFE_CTAS.some((c) => c.href === path),
            `excluded transactional link ${path} on ${route.path}`,
          ).toBe(false);
          continue;
        }
        internalHrefs.push(path);
      }

      for (const hrefPath of [...new Set(internalHrefs)].slice(0, 12)) {
        const linkResponse = await page.request.get(hrefPath, {
          maxRedirects: 0,
        });
        const status = linkResponse.status();
        if (status >= 300 && status < 400) {
          const location = linkResponse.headers().location || "";
          expect(location).not.toMatch(/\/login(\?|$)/);
          continue;
        }
        expect(status, `GET ${hrefPath} from ${route.path}`).toBeLessThan(400);
      }

      expect(pageErrors, pageErrors.join(" | ")).toEqual([]);
      expect(failedCritical, failedCritical.join(" | ")).toEqual([]);
    });
  }

  test("sitemap includes inventory routes with HTTPS apex", async ({
    request,
  }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.status()).toBe(200);
    const xml = await res.text();
    expect(xml).toMatch(/<urlset/);
    for (const route of INFORMATIONAL_RELEASE_ROUTES) {
      if (!route.inSitemap) continue;
      const loc = route.path === "/" ? `${APEX}/` : `${APEX}${route.path}`;
      // Next sitemap may omit trailing slash on apex.
      const alt = route.path === "/" ? APEX : loc;
      expect(
        xml.includes(`<loc>${loc}</loc>`) || xml.includes(`<loc>${alt}</loc>`),
        `sitemap missing ${route.path}`,
      ).toBe(true);
    }
    for (const prefix of EXCLUDED_TRANSACTIONAL_PATH_PREFIXES) {
      expect(xml).not.toContain(`<loc>${APEX}${prefix}</loc>`);
    }
    const locs = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
    expect(new Set(locs).size).toBe(locs.length);
    for (const loc of locs) {
      expect(loc).toMatch(/^https:\/\/mapable\.com\.au(\/|$)/);
    }
  });

  test("404 page is usable HTML with axe serious/critical clean", async ({
    page,
  }) => {
    const response = await page.goto(
      "/this-path-should-not-exist-informational-boundary-404",
      { waitUntil: "domcontentloaded" },
    );
    expect(response).not.toBeNull();
    expect(response!.status()).toBe(404);
    const type = response!.headers()["content-type"] || "";
    expect(type).toMatch(/text\/html/i);
    await settle(page);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    await expect(page.locator("h1").first()).toBeVisible();
    await expect(
      page.locator('a[href="/"], a[href="/help"], a[href="/contact"]').first(),
    ).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    const serious = results.violations.filter((v) =>
      ["critical", "serious"].includes(v.impact || ""),
    );
    expect(serious, JSON.stringify(serious.map((v) => v.id))).toEqual([]);
  });

  test("homepage CTAs stay within informational-safe destinations", async ({
    page,
  }) => {
    await page.goto("/");
    await settle(page);
    const allowed = new Set<string>(INFORMATIONAL_SAFE_CTAS.map((c) => c.href));
    for (const cta of INFORMATIONAL_SAFE_CTAS) {
      const link = page.getByRole("link", { name: cta.label }).first();
      await expect(link).toBeVisible();
      const href = await link.getAttribute("href");
      expect(allowed.has(href || "")).toBe(true);
      expect(isExcludedTransactionalPath(href || "")).toBe(false);
    }
    expect(
      await page.getByRole("link", { name: /^Request support$/i }).count(),
    ).toBe(0);
    expect(
      await page.getByRole("link", { name: /^Verify my venue$/i }).count(),
    ).toBe(0);
  });

  test("inventory paths are classified as informational", () => {
    for (const route of INFORMATIONAL_RELEASE_ROUTES) {
      expect(isInformationalReleasePath(route.path)).toBe(true);
    }
  });
});
