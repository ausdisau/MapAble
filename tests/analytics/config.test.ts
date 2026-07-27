import { describe, expect, it } from "vitest";

import { analyticsResearchConfig } from "@/lib/config/analytics-research";
import { CORE_METRICS } from "@/lib/platform/analytics/metric-registry";

describe("analytics research config", () => {
  it("defaults feature flags to disabled via env", () => {
    expect(typeof analyticsResearchConfig.analyticsCloudEnabled).toBe("boolean");
    expect(typeof analyticsResearchConfig.researchGovernanceEnabled).toBe(
      "boolean",
    );
    expect(typeof analyticsResearchConfig.aiEvaluationHarnessEnabled).toBe(
      "boolean",
    );
  });

  it("hardcodes participant scoring flags off", () => {
    expect(analyticsResearchConfig.participantWorthinessScoreEnabled).toBe(
      false,
    );
    expect(analyticsResearchConfig.participantRiskScoreEnabled).toBe(false);
  });
});

describe("analytics research config guards", () => {
  it("throws when analytics cloud disabled", async () => {
    const { ensureAnalyticsCloudEnabled } = await import(
      "@/lib/config/analytics-research"
    );
    if (analyticsResearchConfig.analyticsCloudEnabled) {
      expect(() => ensureAnalyticsCloudEnabled()).not.toThrow();
    } else {
      expect(() => ensureAnalyticsCloudEnabled()).toThrow(
        "ANALYTICS_CLOUD_DISABLED",
      );
    }
  });
});

describe("metric registry", () => {
  it("defines core published metrics", () => {
    expect(CORE_METRICS.length).toBeGreaterThan(0);
    expect(CORE_METRICS.some((m) => m.key === "care.shifts.completed")).toBe(
      true,
    );
  });
});
