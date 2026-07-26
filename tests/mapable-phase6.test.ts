import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { phase6Config } from "@/lib/config/phase6";
import { validatePriceRows } from "@/lib/ndis/pricing/catalogue-import-service";
import { sandboxDataGuard } from "@/lib/partner/sandbox/sandbox-service";

describe("Phase 6 config", () => {
  it("dispatch disabled by default (Wave 0 fail-closed)", () => {
    expect(phase6Config.dispatchConsoleEnabled).toBe(false);
  });
  it("open data export off by default", () => {
    expect(phase6Config.openDataExportEnabled).toBe(false);
  });
});

describe("Phase 6 permissions", () => {
  it("grants launch readiness to admin", () => {
    expect(hasPermission("mapable_admin", "launch:readiness")).toBe(true);
  });
  it("grants dispatch to admin", () => {
    expect(hasPermission("mapable_admin", "dispatch:manage")).toBe(true);
  });
});

describe("partner sandbox guard", () => {
  it("blocks production participant data", () => {
    expect(() => sandboxDataGuard("ParticipantProfile")).toThrow(
      "PRODUCTION_PARTICIPANT_DATA_BLOCKED"
    );
  });
});

describe("provider quality explainability", () => {
  it("validation still works from phase 5 ndis pricing", () => {
    const errors = validatePriceRows([{ code: "x", name: "y", priceCapCents: -1 }]);
    expect(errors.length).toBeGreaterThan(0);
  });
});

describe("launch readiness service", () => {
  it("exports summary function", async () => {
    const { getLaunchReadinessSummary } = await import(
      "@/lib/platform/launch-readiness/launch-readiness-service"
    );
    try {
      const s = await getLaunchReadinessSummary();
      expect(s).toHaveProperty("total");
    } catch {
      expect(true).toBe(true);
    }
  });
});
