import { describe, expect, it } from "vitest";

import {
  assertEnforcePolicyShape,
  createScriptNonce,
  isCspPreviewEnforceEnabled,
} from "@/lib/security/csp-preview-enforce";
import {
  buildContentSecurityPolicyEnforce,
  buildContentSecurityPolicyReportOnly,
} from "@/lib/security/headers";

function env(partial: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return partial as unknown as NodeJS.ProcessEnv;
}

describe("CSP preview enforce gate", () => {
  it("defaults fail-closed (flag off)", () => {
    expect(isCspPreviewEnforceEnabled(env({}))).toBe(false);
    expect(
      isCspPreviewEnforceEnabled(
        env({ MAPABLE_CSP_ENFORCE_PREVIEW: "false", VERCEL_ENV: "preview" }),
      ),
    ).toBe(false);
  });

  it("never enables on Vercel production even when flag is true", () => {
    expect(
      isCspPreviewEnforceEnabled(
        env({
          MAPABLE_CSP_ENFORCE_PREVIEW: "true",
          VERCEL: "1",
          VERCEL_ENV: "production",
        }),
      ),
    ).toBe(false);
  });

  it("enables on Vercel preview when flag is true", () => {
    expect(
      isCspPreviewEnforceEnabled(
        env({
          MAPABLE_CSP_ENFORCE_PREVIEW: "true",
          VERCEL: "1",
          VERCEL_ENV: "preview",
          NODE_ENV: "production",
        }),
      ),
    ).toBe(true);
  });

  it("enables in local test when flag is true", () => {
    expect(
      isCspPreviewEnforceEnabled(
        env({
          MAPABLE_CSP_ENFORCE_PREVIEW: "true",
          NODE_ENV: "test",
          VITEST: "true",
        }),
      ),
    ).toBe(true);
  });

  it("enables for non-Vercel next start (CI) when flag is true", () => {
    expect(
      isCspPreviewEnforceEnabled(
        env({
          MAPABLE_CSP_ENFORCE_PREVIEW: "true",
          NODE_ENV: "production",
        }),
      ),
    ).toBe(true);
  });

  it("stays hard-off when VERCEL_ENV=production without VERCEL=1", () => {
    expect(
      isCspPreviewEnforceEnabled(
        env({
          MAPABLE_CSP_ENFORCE_PREVIEW: "true",
          VERCEL_ENV: "production",
          NODE_ENV: "production",
        }),
      ),
    ).toBe(false);
  });

  it("rejects empty nonce for enforce builder", () => {
    expect(() => buildContentSecurityPolicyEnforce("")).toThrow(/nonce/i);
    expect(() => buildContentSecurityPolicyEnforce("   ")).toThrow(/nonce/i);
  });

  it("builds enforce policy with matching nonce and without unsafe-eval", () => {
    const nonce = createScriptNonce();
    const csp = buildContentSecurityPolicyEnforce(nonce);
    expect(assertEnforcePolicyShape(csp, nonce)).toEqual([]);
    const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src "));
    expect(scriptSrc).toBeTruthy();
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(scriptSrc).not.toContain("'unsafe-inline'");
    // style-src may still use unsafe-inline for Next.js CSS — not a script bypass
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  it("keeps report-only production policy unchanged (unsafe-eval present)", () => {
    const reportOnly = buildContentSecurityPolicyReportOnly();
    expect(reportOnly).toContain("'unsafe-eval'");
    expect(reportOnly).toContain("'unsafe-inline'");
    expect(reportOnly).toContain("report-uri /api/security/csp-report");
    expect(reportOnly).toContain("object-src 'none'");
    expect(reportOnly).toContain("frame-ancestors 'none'");
  });
});
