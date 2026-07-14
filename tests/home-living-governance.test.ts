import { describe, expect, it } from "vitest";

import {
  classifyClinicalBoundary,
  evaluateComplexSupportEligibility,
} from "@/lib/home-living/home-living-service";

describe("Home and Living governance", () => {
  it("keeps diagnosis, medication changes and restrictive practice human-only", () => {
    expect(classifyClinicalBoundary("diagnosis")).toBe(
      "prohibited_ai_decision",
    );
    expect(classifyClinicalBoundary("medication_change")).toBe(
      "prohibited_ai_decision",
    );
    expect(classifyClinicalBoundary("restrictive_practice")).toBe(
      "prohibited_ai_decision",
    );
  });

  it("accepts only current verified competency evidence", () => {
    const result = evaluateComplexSupportEligibility({
      requiredCompetencies: ["enteral_feeding"],
      participantId: "participant-1",
      evidence: [
        {
          competencyType: "enteral_feeding",
          verificationStatus: "verified",
          effectiveAt: new Date("2026-01-01T00:00:00.000Z"),
          expiresAt: new Date("2027-01-01T00:00:00.000Z"),
          revokedAt: null,
          participantId: "participant-1",
        },
      ],
      now: new Date("2026-07-01T00:00:00.000Z"),
    });
    expect(result.eligibility).toBe("eligible");
    expect(result.reviewerRequired).toBe(false);
  });

  it("routes expired or missing competency evidence to human review", () => {
    const result = evaluateComplexSupportEligibility({
      requiredCompetencies: ["seizure_support", "diabetes_support"],
      participantId: "participant-1",
      evidence: [
        {
          competencyType: "seizure_support",
          verificationStatus: "verified",
          effectiveAt: new Date("2025-01-01T00:00:00.000Z"),
          expiresAt: new Date("2026-01-01T00:00:00.000Z"),
          revokedAt: null,
          participantId: null,
        },
      ],
      now: new Date("2026-07-01T00:00:00.000Z"),
    });
    expect(result.eligibility).toBe("requires_human_review");
    expect(result.expiredRequirements).toContain("seizure_support");
    expect(result.missingRequirements).toContain("diabetes_support");
  });
});
