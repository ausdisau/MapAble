import { describe, expect, it } from "vitest";

import {
  buildContentSecurityPolicyReportOnly,
  getBaselineSecurityHeaders,
} from "@/lib/security/headers";

describe("baseline security headers", () => {
  it("includes nosniff, referrer, permissions, frame denial, and CSP report-only", () => {
    const headers = getBaselineSecurityHeaders();
    const map = Object.fromEntries(headers.map((h) => [h.key, h.value]));

    expect(map["X-Content-Type-Options"]).toBe("nosniff");
    expect(map["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(map["Permissions-Policy"]).toMatch(/camera=\(\)/);
    expect(map["X-Frame-Options"]).toBe("DENY");
    expect(map["Content-Security-Policy-Report-Only"]).toBeTruthy();
    expect(map["Strict-Transport-Security"]).toBeUndefined();
  });

  it("builds a CSP without unrestricted script-src wildcards", () => {
    const csp = buildContentSecurityPolicyReportOnly();
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toMatch(/script-src[^;]*\*/);
    expect(csp).not.toContain("script-src *");
  });
});
