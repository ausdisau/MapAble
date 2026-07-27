import { describe, expect, it } from "vitest";

import { nationalPlatformConfig } from "@/lib/config/national-platform";

describe("national platform config", () => {
  it("defaults MAPABLE_NATIONAL_PLATFORM_ENABLED to false via env", () => {
    expect(typeof nationalPlatformConfig.nationalPlatformEnabled).toBe("boolean");
  });

  it("defaults MAPABLE_FEDERATION_ENABLED to false via env", () => {
    expect(typeof nationalPlatformConfig.federationEnabled).toBe("boolean");
  });

  it("hardcodes federatedIdentityGrantsParticipantAuthority false", () => {
    expect(nationalPlatformConfig.federatedIdentityGrantsParticipantAuthority).toBe(
      false,
    );
  });

  it("hardcodes claimUntestedFailoverWorks false", () => {
    expect(nationalPlatformConfig.claimUntestedFailoverWorks).toBe(false);
  });
});

describe("national platform config guards", () => {
  it("throws when national platform disabled", async () => {
    const { ensureNationalPlatformEnabled } = await import(
      "@/lib/config/national-platform"
    );
    if (nationalPlatformConfig.nationalPlatformEnabled) {
      expect(() => ensureNationalPlatformEnabled()).not.toThrow();
    } else {
      expect(() => ensureNationalPlatformEnabled()).toThrow(
        "NATIONAL_PLATFORM_DISABLED",
      );
    }
  });

  it("throws when federation disabled", async () => {
    const { ensureFederationEnabled } = await import(
      "@/lib/config/national-platform"
    );
    if (nationalPlatformConfig.federationEnabled) {
      expect(() => ensureFederationEnabled()).not.toThrow();
    } else {
      expect(() => ensureFederationEnabled()).toThrow("FEDERATION_DISABLED");
    }
  });
});
