import { describe, expect, it } from "vitest";

import { evaluationResultSchema } from "@mapable/contracts";
import { decideProposedAction } from "@mapable/intelligence-kernel";
import { planSupportedJourney } from "@/lib/intelligence/careos/journey/supported-journey";

describe("CareOS evaluation harness", () => {
  it("replays supported journey planning deterministically", () => {
    const input = {
      tenantId: "synthetic-tenant",
      participantId: "synthetic-participant",
      appointment: { id: "a", startsAt: "2026-07-20T10:00:00.000Z", timezone: "Australia/Sydney", destination: "Synthetic clinic" },
      requirements: { serviceType: "personal_care", workerCredentials: ["first_aid"], communicationSupport: ["plain_language"], wheelchairAccessible: true, requiresRamp: true, assistanceAnimal: false, minimumConnectionMinutes: 15 },
      excludedWorkerIds: [],
      excludedProviderIds: [],
      idempotencyKey: "e6e9ed94-c727-4512-a1d6-4d35c2d9c174",
    };
    expect(planSupportedJourney(input)).toEqual(planSupportedJourney(input));
  });

  it("routes safeguarding to human review and denies high autonomy", () => {
    const action = {
      id: "action",
      capability: "care.worker-match.propose",
      domain: "care",
      purpose: "test",
      participantId: "participant",
      operation: "execute_booking",
      input: {},
      evidence: [],
      uncertainty: [],
      reversibility: "irreversible" as const,
      autonomyLevel: 3 as const,
      confirmationRequired: true,
      expiresAt: "2030-01-01T00:00:00.000Z",
    };
    expect(decideProposedAction({ action, authority: null, capabilityEnabled: true, evidenceComplete: false, safeguardingSignal: true }).decision).toBe("ESCALATE_SAFEGUARDING");
    expect(decideProposedAction({ action, authority: null, capabilityEnabled: true, evidenceComplete: true }).decision).toBe("DENY_NO_AUTHORITY");
  });

  it("emits schema-valid evaluation results", () => {
    expect(evaluationResultSchema.parse({
      schemaVersion: "1.0",
      scenarioId: "supported-journey",
      expectedOutcome: "RECOMMEND",
      observedOutcome: "RECOMMEND",
      safetyAssertions: [{ id: "no-external-action", passed: true }],
      accessibilityAssertions: [{ id: "human-fallback", passed: true }],
      latencyMs: 1,
      regressionMetadata: { planner: "deterministic" },
    }).observedOutcome).toBe("RECOMMEND");
  });
});
