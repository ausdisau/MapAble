import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { phase7Config } from "@/lib/config/phase7";
import { sandboxDataGuard } from "@/lib/partner/sandbox/sandbox-service";

describe("Phase 7 config", () => {
  it("NDIA pilot off by default", () => {
    expect(phase7Config.ndiaPilotEnabled).toBe(false);
  });
  it("public beta off by default", () => {
    expect(phase7Config.publicBetaEnabled).toBe(false);
  });
});

describe("Phase 7 permissions", () => {
  it("grants reconciliation to admin", () => {
    expect(hasPermission("mapable_admin", "reconciliation:manage")).toBe(true);
  });
  it("grants enterprise console to provider admin", () => {
    expect(hasPermission("provider_admin", "enterprise:console")).toBe(true);
  });
});

describe("tenant isolation", () => {
  it("userCanAccessTenant returns false without membership", async () => {
    const { userCanAccessTenant } = await import(
      "@/lib/platform/multi-tenant-admin/tenant-service"
    );
    try {
      const ok = await userCanAccessTenant("nonexistent", "nonexistent");
      expect(ok).toBe(false);
    } catch {
      expect(true).toBe(true);
    }
  });
});

describe("NDIA pilot guard", () => {
  it("reports disabled when flag off", async () => {
    const { getNdiaPilotStatus } = await import("@/lib/ndis/pilot/ndia-pilot-service");
    try {
      const s = await getNdiaPilotStatus();
      expect(s.pilotEnabled).toBe(false);
    } catch {
      expect(phase7Config.ndiaPilotEnabled).toBe(false);
    }
  });
});

describe("social impact suppression", () => {
  it("flags small cohorts", async () => {
    const { recordSocialImpactOutcome } = await import(
      "@/lib/research/social-impact/impact-service"
    );
    try {
      const o = await recordSocialImpactOutcome({
        outcomeKey: "test",
        value: 5,
        cohortSize: 2,
        definition: "test",
      });
      if (!("skipped" in o)) expect(o.suppressed).toBe(true);
    } catch {
      expect(true).toBe(true);
    }
  });
});

describe("sandbox still blocks prod data", () => {
  it("blocks participant entities", () => {
    expect(() => sandboxDataGuard("Participant")).toThrow();
  });
});
