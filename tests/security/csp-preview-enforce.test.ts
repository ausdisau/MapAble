import { describe, expect, it } from "vitest";

import {
  createScriptNonce,
  isCspPreviewEnforceEnabled,
} from "@/lib/security/csp-preview-enforce";
import { buildContentSecurityPolicyEnforce } from "@/lib/security/headers";

function env(partial: Record<string, string | undefined>): NodeJS.ProcessEnv {
  return partial as unknown as NodeJS.ProcessEnv;
}

describe("CSP preview enforce gate", () => {
  it("defaults fail-closed", () => {
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

  it("builds a path-agnostic enforce policy without unsafe-eval for smoke routes", () => {
    const nonce = createScriptNonce();
    const csp = buildContentSecurityPolicyEnforce(nonce);
    expect(csp).toContain(`'nonce-${nonce}'`);
    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).toContain("report-uri /api/security/csp-report");

    // Same policy applies to inventoried smoke entry points (header is global).
    for (const path of [
      "/",
      "/login",
      "/provider-finder",
      "/accessibility-map",
      "/care",
      "/transport",
    ]) {
      expect(path.startsWith("/")).toBe(true);
      expect(csp).toContain("default-src 'self'");
    }
  });
});
