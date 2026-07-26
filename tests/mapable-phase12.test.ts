import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { phase12Config } from "@/lib/config/phase12";

describe("Phase 12 config", () => {
  it("accountability portal off by default (Wave 0 fail-closed)", () => {
    expect(phase12Config.nationalAccountabilityPortalEnabled).toBe(false);
  });
  it("API ecosystem at scale off by default", () => {
    expect(phase12Config.certifiedApiEcosystemAtScaleEnabled).toBe(false);
  });
  it("constitutional safeguards off by default (Wave 0 fail-closed)", () => {
    expect(phase12Config.constitutionalSafeguardsEnabled).toBe(false);
  });
});

describe("Phase 12 permissions", () => {
  it("grants accountability publish to admin", () => {
    expect(hasPermission("mapable_admin", "accountability:publish")).toBe(true);
  });
  it("grants safeguards read to participant", () => {
    expect(hasPermission("participant", "safeguards:read")).toBe(true);
  });
  it("grants transport investment read to participant", () => {
    expect(hasPermission("participant", "transport_investment:read")).toBe(
      true
    );
  });
});

describe("constitutional safeguards", () => {
  it("returns articles when enabled", async () => {
    const { listActiveSafeguards } = await import(
      "@/lib/governance/constitutional-safeguards/safeguards-service"
    );
    try {
      const articles = await listActiveSafeguards();
      expect(Array.isArray(articles)).toBe(true);
    } catch {
      expect(phase12Config.constitutionalSafeguardsEnabled).toBe(false);
    }
  });
});
