import { describe, expect, it } from "vitest";

import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";
import {
  assertQualityComplianceAllowed,
  getProhibitedQualityMessage,
} from "@/lib/quality/compliance-boundaries";

describe("quality compliance boundaries", () => {
  it("keeps automatic accreditation decisions disabled", () => {
    expect(qualityAccreditationConfig.automaticAccreditationDecisionEnabled).toBe(
      false,
    );
    expect(() =>
      assertQualityComplianceAllowed("automatic_accreditation_decision"),
    ).not.toThrow();
  });

  it("keeps participant incident provider scoring disabled", () => {
    expect(
      qualityAccreditationConfig.participantIncidentToProviderScoreEnabled,
    ).toBe(false);
    expect(() =>
      assertQualityComplianceAllowed("participant_incident_provider_score"),
    ).not.toThrow();
  });

  it("returns human-readable prohibition messages", () => {
    expect(
      getProhibitedQualityMessage("automatic_accreditation_decision"),
    ).toContain("human assessors");
    expect(
      getProhibitedQualityMessage("participant_incident_provider_score"),
    ).toContain("participant incidents");
  });
});
