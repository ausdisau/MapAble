import { describe, expect, it } from "vitest";

import { lifeTwinDomainRecordSchema } from "@/lib/intelligence/careos/life-twin/types";
import {
  runDeterministicSupportSimulation,
} from "@/lib/intelligence/careos/simulation/support-simulation";
import { commonsContributionPreferenceSchema } from "@mapable/contracts";

describe("CareOS Life Twin and support simulation", () => {
  it("keeps Life Twin inferences explicitly unverified", () => {
    const inferred = lifeTwinDomainRecordSchema.parse({
      domain: "transport",
      value: { likelyPreference: "morning" },
      source: "inference",
      verificationStatus: "unverified",
      consentScopes: [],
    });
    expect(inferred.verificationStatus).toBe("unverified");
  });

  it("exposes simulation trade-offs without a universal score or operational action", () => {
    const result = runDeterministicSupportSimulation({
      scenarioName: "inaccessible_station",
      assumptions: ["A station lift is unavailable."],
      requiredSafeguards: ["Confirm accessible alternative before travel."],
      participantPreferences: ["Avoid unplanned transfers."],
    });
    expect(result.noOperationalChangeMade).toBe(true);
    expect(result.humanReviewRequired).toBe(true);
    expect(result.outcomes.map((outcome) => outcome.measure)).not.toContain("quality_score");
  });

  it("keeps Commons contribution opt-in and revocable", () => {
    const preference = commonsContributionPreferenceSchema.parse({
      schemaVersion: "1.0",
      participantId: "participant_1",
      categories: ["transport_gaps"],
      geographicPrecision: "region",
      retentionDays: 30,
      allowResearch: false,
      allowAdvocacy: true,
      allowModelEvaluation: false,
      optedInAt: "2026-07-13T00:00:00.000Z",
      revokedAt: null,
    });
    expect(preference.allowResearch).toBe(false);
    expect(preference.geographicPrecision).toBe("region");
  });
});
