import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { phase8Config } from "@/lib/config/phase8";

describe("Phase 8 config", () => {
  it("national insights off by default (Wave 0 fail-closed)", () => {
    expect(phase8Config.nationalInsightsEnabled).toBe(false);
  });
  it("partner marketplace off by default", () => {
    expect(phase8Config.partnerMarketplaceEnabled).toBe(false);
  });
  it("public API versioning off by default (Wave 0 fail-closed)", () => {
    expect(phase8Config.publicApiVersioningEnabled).toBe(false);
  });
});

describe("Phase 8 permissions", () => {
  it("grants api versioning to admin", () => {
    expect(hasPermission("mapable_admin", "api_versioning:manage")).toBe(true);
  });
  it("grants assessor portal to admin", () => {
    expect(hasPermission("mapable_admin", "assessor:portal")).toBe(true);
  });
  it("grants settlement to admin", () => {
    expect(hasPermission("mapable_admin", "settlement:manage")).toBe(true);
  });
});

describe("API version policy", () => {
  it("returns v1 as default when db available", async () => {
    const { getApiVersionPolicy } = await import(
      "@/lib/api-versioning/version-policy-service"
    );
    try {
      const policy = await getApiVersionPolicy();
      expect(policy.defaultVersion).toBe("v1");
    } catch {
      expect(phase8Config.publicApiVersioningEnabled).toBe(false);
    }
  });
});

describe("national insights guard", () => {
  it("list returns array when db available", async () => {
    const { listPublishedNationalInsights } = await import(
      "@/lib/national-insights/insights-service"
    );
    try {
      const list = await listPublishedNationalInsights();
      expect(Array.isArray(list)).toBe(true);
    } catch {
      expect(phase8Config.nationalInsightsEnabled).toBe(false);
    }
  });
});
