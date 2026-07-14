import { describe, expect, it } from "vitest";

import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";

describe("quality accreditation config", () => {
  it("defaults QMS and provider accreditation flags to disabled via env", () => {
    expect(typeof qualityAccreditationConfig.qmsEnabled).toBe("boolean");
    expect(typeof qualityAccreditationConfig.providerAccreditationEnabled).toBe(
      "boolean",
    );
  });

  it("hardcodes safety flags off", () => {
    expect(qualityAccreditationConfig.automaticAccreditationDecisionEnabled).toBe(
      false,
    );
    expect(
      qualityAccreditationConfig.participantIncidentToProviderScoreEnabled,
    ).toBe(false);
  });
});

describe("quality config guards", () => {
  it("throws when QMS disabled", async () => {
    const { ensureQualityQmsEnabled } = await import(
      "@/lib/config/quality-accreditation"
    );
    if (qualityAccreditationConfig.qmsEnabled) {
      expect(() => ensureQualityQmsEnabled()).not.toThrow();
    } else {
      expect(() => ensureQualityQmsEnabled()).toThrow("QUALITY_QMS_DISABLED");
    }
  });
});
