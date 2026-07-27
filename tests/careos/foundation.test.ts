import { describe, expect, it } from "vitest";

import {
  CAREOS_PRODUCTION_CEILING,
  classifyCareOSAction,
  isAuthorityLevelAllowed,
} from "@/lib/intelligence/careos/policy/autonomy";
import {
  assertCareOSCapabilityAllowed,
  isProhibitedCareOSCapability,
} from "@/lib/intelligence/careos/policy/prohibited-uses";
import { redactCareOSMetadata } from "@/lib/intelligence/careos/audit/redaction";
import { CareOSToolRegistry } from "@/lib/intelligence/careos/tools/registry";

describe("CareOS Foundation safety controls", () => {
  it("keeps the production autonomy ceiling at recommendations", () => {
    expect(CAREOS_PRODUCTION_CEILING).toBe("L2_RECOMMEND");
    expect(classifyCareOSAction("recommend_mission")).toBe("L2_RECOMMEND");
    expect(isAuthorityLevelAllowed("L2_RECOMMEND")).toBe(true);
    expect(isAuthorityLevelAllowed("L3_CONFIRMED_ACTION")).toBe(false);
  });

  it("blocks prohibited capabilities in policy code", () => {
    expect(isProhibitedCareOSCapability("clinical_diagnosis")).toBe(true);
    expect(() => assertCareOSCapabilityAllowed("clinical_diagnosis")).toThrow(
      "prohibited"
    );
  });

  it("redacts secrets and unnecessary health details before audit storage", () => {
    expect(
      redactCareOSMetadata({
        apiKey: "private",
        nested: { symptom: "sensitive", useful: "kept" },
      })
    ).toEqual({
      apiKey: "[REDACTED]",
      nested: { symptom: "[REDACTED]", useful: "kept" },
    });
  });

  it("does not permit a write tool in the Foundation registry", () => {
    const registry = new CareOSToolRegistry();
    expect(() =>
      registry.register({
        name: "create_booking",
        description: "must never be available",
        module: "care",
        risk: "write",
        inputSchema: {} as never,
        outputSchema: {} as never,
        requiredPermissions: [],
        requiredConsentScopes: [],
        authorityLevel: "L3_CONFIRMED_ACTION",
        requiresParticipantConfirmation: true,
        execute: async () => ({}),
      })
    ).toThrow("read-only");
  });
});
