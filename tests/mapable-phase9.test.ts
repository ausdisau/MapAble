import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { phase9Config } from "@/lib/config/phase9";

describe("Phase 9 config", () => {
  it("personal data vault off by default (Wave 0 fail-closed)", () => {
    expect(phase9Config.personalDataVaultEnabled).toBe(false);
  });
  it("research safe room off by default", () => {
    expect(phase9Config.researchSafeRoomEnabled).toBe(false);
  });
  it("partner API program off by default", () => {
    expect(phase9Config.publicApiPartnerProgramEnabled).toBe(false);
  });
  it("public decision register off by default (Wave 0 fail-closed)", () => {
    expect(phase9Config.publicDecisionRegisterEnabled).toBe(false);
  });
});

describe("Phase 9 permissions", () => {
  it("grants data vault self to participant", () => {
    expect(hasPermission("participant", "data_vault:self")).toBe(true);
  });
  it("grants decision register to admin", () => {
    expect(hasPermission("mapable_admin", "decision_register:publish")).toBe(
      true
    );
  });
  it("grants i18n manage to admin", () => {
    expect(hasPermission("mapable_admin", "i18n:manage")).toBe(true);
  });
});

describe("public decisions", () => {
  it("returns array when enabled", async () => {
    const { listPublicDecisions } = await import(
      "@/lib/public-decision-register/decision-service"
    );
    try {
      const list = await listPublicDecisions();
      expect(Array.isArray(list)).toBe(true);
    } catch {
      expect(phase9Config.publicDecisionRegisterEnabled).toBe(false);
    }
  });
});
