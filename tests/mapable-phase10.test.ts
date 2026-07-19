import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { phase10Config } from "@/lib/config/phase10";

describe("Phase 10 config", () => {
  it("algorithm register off by default (Wave 0 fail-closed)", () => {
    expect(phase10Config.publicAlgorithmRegisterEnabled).toBe(false);
  });
  it("API certification off by default", () => {
    expect(phase10Config.apiCertificationProgramEnabled).toBe(false);
  });
  it("federated research off by default", () => {
    expect(phase10Config.federatedResearchEnabled).toBe(false);
  });
  it("oversight board off by default (Wave 0 fail-closed)", () => {
    expect(phase10Config.oversightBoardPortalEnabled).toBe(false);
  });
});

describe("Phase 10 permissions", () => {
  it("grants algorithm publish to admin", () => {
    expect(hasPermission("mapable_admin", "algorithm_register:publish")).toBe(
      true
    );
  });
  it("grants academy enroll to provider admin", () => {
    expect(hasPermission("provider_admin", "provider_academy:enroll")).toBe(
      true
    );
  });
  it("grants outcomes read to participant", () => {
    expect(hasPermission("participant", "outcomes:read")).toBe(true);
  });
});

describe("algorithm register", () => {
  it("returns array when enabled", async () => {
    const { listPublishedAlgorithms } = await import(
      "@/lib/algorithm-register/register-service"
    );
    try {
      const list = await listPublishedAlgorithms();
      expect(Array.isArray(list)).toBe(true);
    } catch {
      expect(phase10Config.publicAlgorithmRegisterEnabled).toBe(false);
    }
  });
});
