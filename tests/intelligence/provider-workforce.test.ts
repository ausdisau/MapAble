import { describe, expect, it } from "vitest";

import {
  evaluateCapacity,
  evaluateProviderCapability,
} from "@mapable/domain-provider";
import { evaluateWorkforceEvidence } from "@mapable/domain-workforce";

describe("provider and workforce evidence policies", () => {
  it("fails closed when required provider accessibility evidence is absent", () => {
    const result = evaluateProviderCapability({
      evidence: [],
      requiredCapabilities: ["personal_care"],
      requiredMobilityFeatures: ["wheelchair_accessible"],
      requiresAssistanceAnimalSupport: true,
      purpose: "care_matching",
    });
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes).toContain("PROVIDER_ACCESSIBILITY_EVIDENCE_MISSING");
  });

  it("does not treat exhausted capacity as available", () => {
    expect(
      evaluateCapacity({
        totalCapacity: 3,
        bookedCapacity: 3,
        serviceType: "personal_care",
        date: "2026-07-14T00:00:00.000Z",
      })
    ).toEqual({ available: 0, hasCapacity: false });
  });

  it("rejects expired or revoked workforce credentials", () => {
    const result = evaluateWorkforceEvidence({
      evidence: [
        {
          credentialType: "wwcc",
          verificationStatus: "verified",
          expiresAt: "2025-01-01T00:00:00.000Z",
          revokedAt: null,
        },
      ],
      requiredCredentialTypes: ["wwcc"],
      now: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes).toContain("CREDENTIAL_EXPIRED_OR_REVOKED:wwcc");
  });
});
