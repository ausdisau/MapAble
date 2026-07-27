import { beforeEach, describe, expect, it, vi } from "vitest";

import { analyticsResearchConfig } from "@/lib/config/analytics-research";
import * as analyticsResearch from "@/lib/config/analytics-research";
import {
  EVALUATION_SCENARIO_IDS,
  runEvaluationScenario,
  runFullEvaluationHarness,
} from "@/lib/intelligence/evaluation";

describe("AI evaluation harness", () => {
  beforeEach(() => {
    if (!analyticsResearchConfig.aiEvaluationHarnessEnabled) {
      vi.spyOn(analyticsResearch, "ensureAiEvaluationHarnessEnabled").mockImplementation(
        () => undefined,
      );
    }
  });

  it("lists all required scenarios", () => {
    expect(EVALUATION_SCENARIO_IDS).toContain("hallucination");
    expect(EVALUATION_SCENARIO_IDS).toContain("authority_bypass");
    expect(EVALUATION_SCENARIO_IDS).toContain("clinical_boundary");
    expect(EVALUATION_SCENARIO_IDS).toContain("safeguarding");
    expect(EVALUATION_SCENARIO_IDS).toContain("leakage");
    expect(EVALUATION_SCENARIO_IDS).toContain("prompt_injection");
    expect(EVALUATION_SCENARIO_IDS).toContain("unfair_recommendations");
    expect(EVALUATION_SCENARIO_IDS).toContain("tool_misuse");
    expect(EVALUATION_SCENARIO_IDS).toContain("ai_disabled");
    expect(EVALUATION_SCENARIO_IDS.length).toBe(9);
  });

  it("blocks participant scoring in unfair recommendations scenario", () => {
    const result = runEvaluationScenario("unfair_recommendations", {
      aiEnabled: true,
      participantScoringAttempt: true,
    });
    expect(result.passed).toBe(false);
    expect(result.observedOutcome).toBe("SCORING_BLOCKED");
  });

  it("escalates safeguarding signals", () => {
    const result = runEvaluationScenario("safeguarding", {
      aiEnabled: true,
      safeguardingSignal: true,
    });
    expect(result.observedOutcome).toBe("ESCALATE_SAFEGUARDING");
  });

  it("fail-closes when AI disabled", () => {
    const result = runEvaluationScenario("ai_disabled", { aiEnabled: false });
    expect(result.passed).toBe(true);
    expect(result.observedOutcome).toBe("AI_DISABLED");
  });

  it("runs full harness report", () => {
    const report = runFullEvaluationHarness({
      aiEnabled: false,
      authorityPresent: false,
    });
    expect(report.scenarios.length).toBe(9);
    expect(report.runAt).toBeTruthy();
  });
});

describe("evaluation harness config guard", () => {
  it("throws when harness disabled", async () => {
    vi.restoreAllMocks();
    const { ensureAiEvaluationHarnessEnabled } = await import(
      "@/lib/config/analytics-research"
    );
    if (analyticsResearchConfig.aiEvaluationHarnessEnabled) {
      expect(() => ensureAiEvaluationHarnessEnabled()).not.toThrow();
    } else {
      expect(() => ensureAiEvaluationHarnessEnabled()).toThrow(
        "AI_EVALUATION_HARNESS_DISABLED",
      );
    }
  });
});
