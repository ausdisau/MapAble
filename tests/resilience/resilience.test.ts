import { describe, expect, it } from "vitest";

import { nationalPlatformConfig } from "@/lib/config/national-platform";
import {
  RESILIENCE_CAPABILITIES,
  canClaimFailoverWorks,
  getResilienceCapability,
  listUntestedCapabilities,
} from "@/lib/platform/resilience";
import {
  FAILOVER_PROCEDURES,
  assertFailoverClaimAllowed,
  getDocumentedTargets,
} from "@/lib/platform/resilience/procedures";

describe("national platform config", () => {
  it("defaults feature flags via env", () => {
    expect(typeof nationalPlatformConfig.nationalPlatformEnabled).toBe("boolean");
    expect(typeof nationalPlatformConfig.federationEnabled).toBe("boolean");
  });

  it("hardcodes safety flags off", () => {
    expect(nationalPlatformConfig.federatedIdentityGrantsParticipantAuthority).toBe(
      false,
    );
    expect(nationalPlatformConfig.claimUntestedFailoverWorks).toBe(false);
  });
});

describe("resilience capabilities", () => {
  it("defines core capabilities", () => {
    expect(RESILIENCE_CAPABILITIES.length).toBeGreaterThan(5);
    expect(getResilienceCapability("pitr")).toBeDefined();
    expect(getResilienceCapability("failover")).toBeDefined();
  });

  it("marks failover as untested", () => {
    const failover = getResilienceCapability("failover");
    expect(failover?.status).toBe("untested");
  });

  it("cannot claim failover works without passed drill", () => {
    expect(canClaimFailoverWorks("passed")).toBe(true);
    expect(canClaimFailoverWorks("failed")).toBe(false);
    expect(canClaimFailoverWorks("not_run")).toBe(false);
    expect(canClaimFailoverWorks(null)).toBe(false);
  });

  it("lists untested capabilities", () => {
    const untested = listUntestedCapabilities();
    expect(untested.some((c) => c.id === "failover")).toBe(true);
  });
});

describe("failover procedures", () => {
  it("documents failover steps without claiming tested", () => {
    expect(FAILOVER_PROCEDURES.length).toBeGreaterThan(0);
    for (const proc of FAILOVER_PROCEDURES) {
      expect(proc.tested).toBe(false);
      expect(proc.steps.length).toBeGreaterThan(0);
    }
  });

  it("throws when failover claim not allowed", () => {
    expect(() => assertFailoverClaimAllowed(false)).toThrow("FAILOVER_NOT_TESTED");
    expect(() => assertFailoverClaimAllowed(true)).not.toThrow();
  });

  it("returns documented RPO/RTO targets", () => {
    const targets = getDocumentedTargets();
    expect(targets.rpoMinutes).toBeGreaterThan(0);
    expect(targets.rtoMinutes).toBeGreaterThan(0);
    expect(targets.primaryRegion).toBeTruthy();
    expect(targets.drRegion).toBeTruthy();
  });
});
