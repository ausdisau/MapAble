import { describe, expect, it } from "vitest";

import { gammaCalculator } from "@/lib/aura-harness/gamma-calculator";
import { resolvePolicyAction } from "@/lib/aura-harness/policy-engine";
import { extractSemanticScores } from "@/lib/aura-harness/semantic-judge";

describe("extractSemanticScores", () => {
  it("scores routine provider search as Low/Low", () => {
    const contexts = extractSemanticScores("searchNdisProviders", {
      q: "physiotherapy sydney",
    });
    const profile = gammaCalculator.calculateProfile(contexts);
    expect(profile.normalizedGamma).toBeLessThan(40);
    expect(profile.concentrationCoeff).toBe(0);
    expect(resolvePolicyAction(profile)).toBe("APPROVE");
  });

  it("spikes privacy/medical for narrative + condition payloads", () => {
    const contexts = extractSemanticScores("publish_geospatial_update", {
      user_reports: "Jane Smith has epilepsy near the station",
      medicalHistory: "insulin dependent diabetes",
      email: "jane@example.com",
    });
    const privacy = contexts[0].dimensions.find((d) => d.id === "privacy");
    const medical = contexts[0].dimensions.find(
      (d) => d.id === "medical_data_exposure",
    );
    expect(privacy?.score).toBeGreaterThanOrEqual(90);
    expect(medical?.score).toBeGreaterThanOrEqual(90);
    const profile = gammaCalculator.calculateProfile(contexts);
    expect(resolvePolicyAction(profile)).toBe("REQUIRE_HITL");
  });

  it("scores destructive delete tools as High/Low DENY", () => {
    const contexts = extractSemanticScores("delete_user_account", {
      user_id: 1042,
    });
    const profile = gammaCalculator.calculateProfile(contexts);
    expect(resolvePolicyAction(profile)).toBe("DENY");
  });

  it("ignores redacted values when re-scoring", () => {
    const contexts = extractSemanticScores("searchNdisProviders", {
      email: "[redacted]",
      medicalHistory: "[redacted]",
      q: "physio",
    });
    const profile = gammaCalculator.calculateProfile(contexts);
    expect(resolvePolicyAction(profile)).toBe("APPROVE");
  });
});
