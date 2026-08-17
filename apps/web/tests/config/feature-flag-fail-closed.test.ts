import { afterEach, describe, expect, it, vi } from "vitest";

describe("Wave 0 capability flags fail closed", () => {
  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it("disables matching engine, NDIA readiness, billing copilot, and case AI when unset", async () => {
    vi.stubEnv("MATCHING_ENGINE_ENABLED", undefined);
    vi.stubEnv("NDIA_READINESS_ENABLED", undefined);
    vi.stubEnv("BILLING_COPILOT_ENABLED", undefined);
    vi.stubEnv("CASE_MANAGEMENT_ENABLED", undefined);
    vi.stubEnv("CASE_MANAGEMENT_AI_ENABLED", undefined);

    const { phase4Config } = await import("@/lib/config/phase4");
    const { phase5Config } = await import("@/lib/config/phase5");
    const { isBillingCopilotEnabled } = await import("@/lib/billing/config");
    const { caseManagementConfig } =
      await import("@/lib/config/case-management");

    expect(phase4Config.matchingEngineEnabled).toBe(false);
    expect(phase5Config.ndiaReadinessEnabled).toBe(false);
    expect(isBillingCopilotEnabled()).toBe(false);
    expect(caseManagementConfig.enabled).toBe(false);
    expect(caseManagementConfig.aiEnabled).toBe(false);
  });

  it("keeps participant confirmation and human-review safety gates fail-open", async () => {
    vi.stubEnv("MATCH_PARTICIPANT_CONFIRM_REQUIRED", undefined);
    vi.stubEnv("AI_MATCHING_REQUIRE_HUMAN_REVIEW", undefined);

    const { platformPatternsConfig } =
      await import("@/lib/config/platform-patterns");
    const { phase5Config } = await import("@/lib/config/phase5");

    expect(platformPatternsConfig.matchParticipantConfirmRequired).toBe(true);
    expect(phase5Config.aiMatchingRequireHumanReview).toBe(true);
  });

  it("keeps starting-work synthetic-only fail-open as a safety default", async () => {
    vi.stubEnv("MAPABLE_STARTING_WORK_SYNTHETIC_ONLY", undefined);
    const { startingWorkPilotConfig } =
      await import("@/lib/config/starting-work-pilot");
    expect(startingWorkPilotConfig.syntheticOnly).toBe(true);
  });
});
