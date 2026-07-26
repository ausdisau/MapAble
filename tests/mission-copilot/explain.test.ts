import { beforeEach, describe, expect, it } from "vitest";

import {
  answerMissionQuestion,
  missionCopilotGuardrails,
} from "@/lib/ai/mission-copilot";
import { runGoldenJourney } from "@/lib/pilot/starting-work/golden-journey";

describe("Mission Copilot", () => {
  beforeEach(() => {
    process.env.MAPABLE_MISSION_COPILOT_ENABLED = "true";
    process.env.MAPABLE_MISSION_PORTFOLIO_ENABLED = "true";
    process.env.MAPABLE_WHAT_CHANGED_ENABLED = "true";
    process.env.MAPABLE_SERVICE_STANDARD_ENABLED = "true";
  });

  it("stays read-only and never claims action", () => {
    const guardrails = missionCopilotGuardrails();
    expect(guardrails.authorityCeiling).toBe("READ_ONLY_EXPLAIN");
    expect(guardrails.forbiddenActions).toContain("assign");
    expect(guardrails.modelRequired).toBe(false);
  });

  it("answers what happens next from projection", () => {
    const result = answerMissionQuestion({
      question: "what_happens_next",
      journey: runGoldenJourney({}),
    });
    expect("disabled" in result).toBe(false);
    if (!("disabled" in result)) {
      expect(result.actionTaken).toBe(false);
      expect(result.authorityCeiling).toBe("READ_ONLY_EXPLAIN");
      expect(result.directResponse.length).toBeGreaterThan(0);
      expect(result.parts[0]?.citations.length).toBeGreaterThan(0);
    }
  });

  it("explains Easy Read without requiring chat", () => {
    const result = answerMissionQuestion({
      question: "easy_read",
      journey: runGoldenJourney({ failureMode: "expired_consent" }),
    });
    if (!("disabled" in result)) {
      expect(result.easyRead).toBeTruthy();
      expect(result.actionTaken).toBe(false);
    }
  });

  it("lists provider questions as drafts only", () => {
    const result = answerMissionQuestion({
      question: "prepare_provider_questions",
      journey: runGoldenJourney({}),
    });
    if (!("disabled" in result)) {
      expect(result.providerQuestions?.length).toBeGreaterThan(0);
      expect(result.actionTaken).toBe(false);
    }
  });
});
