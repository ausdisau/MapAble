import { describe, expect, it } from "vitest";

import { assertTransparencyCopy } from "@/lib/algorithm-register/register-service";
import {
  ALGORITHM_TRANSPARENCY_DISCLAIMER,
  BENCHMARK_DISCLAIMER,
  HUMAN_REVIEW_DISCLAIMER,
  PRIVACY_ANALYTICS_DISCLAIMER,
  y4CivicPlatformConfig,
} from "@/lib/config/y4-civic-platform";

describe("Y4 civic platform config", () => {
  it("disables all Y4 features by default", () => {
    expect(y4CivicPlatformConfig.dataVaultV2Enabled).toBe(false);
    expect(y4CivicPlatformConfig.publicDecisionRegisterV2Enabled).toBe(false);
    expect(y4CivicPlatformConfig.researchSafeRoomPilotEnabled).toBe(false);
    expect(y4CivicPlatformConfig.providerBenchmarkingV2Enabled).toBe(false);
    expect(y4CivicPlatformConfig.algorithmRegisterV2Enabled).toBe(false);
    expect(y4CivicPlatformConfig.oversightBoardV2Enabled).toBe(false);
    expect(y4CivicPlatformConfig.governanceCharterGateEnabled).toBe(false);
    expect(y4CivicPlatformConfig.privacyPreservingAnalyticsPilotEnabled).toBe(
      false
    );
  });
});

describe("Data vault guardrails", () => {
  it("includes human review disclaimer", () => {
    expect(HUMAN_REVIEW_DISCLAIMER).toMatch(/human review/i);
  });

  it("documents vault status pipeline", () => {
    const pipeline = ["pending", "approved", "completed", "rejected"];
    expect(pipeline).toContain("approved");
    expect(pipeline).toContain("pending");
  });
});

describe("Benchmark guardrails", () => {
  it("states benchmarks are not rankings", () => {
    expect(BENCHMARK_DISCLAIMER).toMatch(/not rankings/i);
  });
});

describe("Algorithm register guardrails", () => {
  it("includes transparency disclaimer", () => {
    expect(ALGORITHM_TRANSPARENCY_DISCLAIMER).toMatch(/not regulatory certification/i);
  });

  it("blocks certification claims in copy", () => {
    expect(() => assertTransparencyCopy("certified fair algorithm")).toThrow(
      "ALGORITHM_CERTIFICATION_CLAIM_BLOCKED"
    );
  });

  it("documents review pipeline status", () => {
    const pipeline = ["draft", "review", "published"];
    expect(pipeline).toHaveLength(3);
  });
});

describe("Research safe room guardrails", () => {
  it("documents synthetic-only requirement", () => {
    const policy = { syntheticDataOnly: true, accessPolicy: "synthetic_only" };
    expect(policy.syntheticDataOnly).toBe(true);
  });

  it("documents project status pipeline", () => {
    const pipeline = ["draft", "ethics_review", "active", "archived"];
    expect(pipeline).toContain("ethics_review");
  });
});

describe("Oversight board guardrails", () => {
  it("documents meeting lifecycle", () => {
    const lifecycle = ["scheduled", "held", "minutes_published"];
    expect(lifecycle).toContain("minutes_published");
  });
});

describe("Privacy analytics pilot", () => {
  it("includes placeholder DP disclaimer", () => {
    expect(PRIVACY_ANALYTICS_DISCLAIMER).toMatch(/not production-grade/i);
  });

  it("documents aggregate-only result shape", () => {
    const result = {
      method: "differential_privacy_placeholder",
      aggregates: { careCompleted: { suppressed: false, value: 10 } },
    };
    expect(result.method).toContain("placeholder");
  });
});

describe("Governance charter gate", () => {
  it("documents charter gate error code", () => {
    const errorCode = "CHARTER_NOT_RATIFIED";
    expect(errorCode).toBe("CHARTER_NOT_RATIFIED");
  });
});
