import { expect, test, type ConsoleMessage, type Page } from "@playwright/test";

/**
 * Automated flag-on CSP enforce matrix (local/CI).
 * Status: VERIFIED only for this synthetic run — Vercel Preview flag-on is NOT_RUN.
 */

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/provider-finder",
  "/accessibility-map",
  "/care",
  "/transport",
] as const;

function collectCspViolations(page: Page): string[] {
  const hits: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    const text = msg.text();
    if (
      /content security policy|csp|refused to (load|execute|connect)/i.test(
        text,
      )
    ) {
      hits.push(text.slice(0, 300));
    }
  });
  return hits;
}

async function assertNoSecretsInHtml(page: Page) {
  const html = await page.content();
  expect(html).not.toMatch(/NEXTAUTH_SECRET|DATABASE_URL|sk_live_|sk_test_/i);
}

/**
 * Catch build/runtime CSP mismatch early.
 *
 * When `.next` was built without MAPABLE_CSP_ENFORCE_PREVIEW=true but the
 * server enforces CSP at runtime, middleware emits a fresh nonce while
 * prerendered `/_next` scripts lack matching nonce attributes. That failure
 * previously surfaced only as `body` hidden / empty title.
 */
async function assertNextScriptsCarryCspNonce(page: Page, csp: string) {
  const nonce = csp.match(/'nonce-([a-f0-9]+)'/)?.[1];
  expect(nonce, "CSP header nonce").toBeTruthy();

  const result = await page.evaluate((expectedNonce) => {
    const scripts = Array.from(
      document.querySelectorAll<HTMLScriptElement>('script[src*="/_next/"]'),
    );
    if (scripts.length === 0) {
      return { ok: false as const, reason: "no_next_scripts", count: 0 };
    }
    const missing = scripts.filter(
      (el) => (el.nonce || el.getAttribute("nonce") || "") !== expectedNonce,
    );
    return {
      ok: missing.length === 0,
      reason: missing.length ? "nonce_mismatch" : "ok",
      count: scripts.length,
      missingSrc: missing.slice(0, 5).map((el) => el.src),
    };
  }, nonce!);

  expect(
    result.ok,
    `Next.js scripts must carry CSP nonce '${nonce}'. ` +
      `Got ${result.reason} (${result.count} scripts` +
      `${result.missingSrc?.length ? `; missing on ${result.missingSrc.join(", ")}` : ""}). ` +
      `Rebuild with MAPABLE_CSP_ENFORCE_PREVIEW=true before pnpm start / test:csp-enforce.`,
  ).toBe(true);
}

test.describe("CSP enforce preview (MAPABLE_CSP_ENFORCE_PREVIEW=true)", () => {
  for (const route of PUBLIC_ROUTES) {
    test(`route ${route} renders under enforce CSP`, async ({ page }) => {
      const cspHits = collectCspViolations(page);
      const response = await page.goto(route, {
        waitUntil: "domcontentloaded",
      });
      expect(response, `response for ${route}`).toBeTruthy();
      expect(response!.status()).toBeLessThan(500);

      const csp = response!.headers()["content-security-policy"];
      expect(csp, "enforce header present").toBeTruthy();
      expect(csp).toMatch(/nonce-[a-f0-9]+/);
      expect(csp).not.toContain("unsafe-eval");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("frame-ancestors 'none'");
      expect(csp).toContain("report-uri /api/security/csp-report");

      // Fail closed on build/runtime nonce mismatch before body visibility.
      await assertNextScriptsCarryCspNonce(page, csp!);

      // Hydration / interactivity smoke — body should be present
      await expect(page.locator("body")).toBeVisible();
      await assertNoSecretsInHtml(page);

      // AccessiBe third-party script is expected to conflict with enforce —
      // record whether acsbapp requests appear (cut-over depends on #389).
      const accessibeRequests: string[] = [];
      page.on("request", (req) => {
        if (/acsbapp\.com|accessibe/i.test(req.url())) {
          accessibeRequests.push(req.url());
        }
      });
      await page.waitForTimeout(500);

      // Framework should not leave a blank document
      const title = await page.title();
      expect(title.length).toBeGreaterThan(0);

      // Soft-check: unexpected CSP console noise (AccessiBe may appear — not a soft pass)
      if (cspHits.length) {
        test.info().annotations.push({
          type: "csp-console",
          description: cspHits.slice(0, 5).join(" | "),
        });
      }
      if (accessibeRequests.length) {
        test.info().annotations.push({
          type: "accessibe-blocked-or-attempted",
          description: accessibeRequests.slice(0, 3).join(" | "),
        });
      }
    });
  }

  test("login navigation remains functional", async ({ page }) => {
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
    // Prefer a credential form or known login landmark without brittle copy
    const email = page
      .locator('input[type="email"], input[name="email"]')
      .first();
    if (await email.count()) {
      await expect(email).toBeVisible();
    }
  });

  test("CSP report sink accepts redacted report under enforce", async ({
    request,
  }) => {
    const res = await request.post("/api/security/csp-report", {
      headers: { "content-type": "application/csp-report" },
      data: {
        "csp-report": {
          "document-uri": "http://127.0.0.1:3000/login?token=secret",
          "blocked-uri": "https://acsbapp.com/apps/app/dist/js/app.js",
          "violated-directive": "script-src",
          "script-sample": "should-not-echo",
        },
      },
    });
    expect(res.status()).toBe(204);
    expect(await res.text()).toBe("");
  });
});
