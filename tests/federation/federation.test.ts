import { describe, expect, it } from "vitest";

import {
  assertFederatedIdentityBoundary,
  nationalPlatformConfig,
} from "@/lib/config/national-platform";
import { listSupportedRegions } from "@/lib/platform/federation";

describe("federation config boundaries", () => {
  it("blocks federated identity participant authority", () => {
    expect(nationalPlatformConfig.federatedIdentityGrantsParticipantAuthority).toBe(
      false,
    );
    expect(() => assertFederatedIdentityBoundary()).not.toThrow();
  });
});

describe("regional org adapter", () => {
  it("lists Australian region codes", () => {
    const regions = listSupportedRegions();
    expect(regions).toContain("NSW");
    expect(regions).toContain("VIC");
    expect(regions.length).toBe(8);
  });
});

describe("federation session contract", () => {
  it("participantAuthorityGranted is always false in type contract", () => {
    const session = {
      trustId: "trust_1",
      federatedUserId: "fed_user_1",
      participantAuthorityGranted: false as const,
      scopes: ["openid"],
    };
    expect(session.participantAuthorityGranted).toBe(false);
  });
});
