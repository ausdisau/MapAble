import { createHash } from "crypto";

import { UNIFIED_PROHIBITED_USES } from "@/lib/careos/policy/unified-prohibited-uses";
import { careosOpportunitiesConfig } from "@/lib/config/careos-opportunities";
import {
  runFullEvaluationHarness,
  type EvaluationHarnessReport,
} from "@/lib/intelligence/evaluation/evaluation-harness";

export type SafetyGateReport = {
  runAt: string;
  allPassed: boolean;
  harness: EvaluationHarnessReport;
  prohibitedRegistrySize: number;
  signature: string;
  blockedCapabilitiesSample: string[];
};

/** Fixture that must pass for CI / merge gate (fail-closed AI disabled path). */
export const SAFETY_GATE_PASSING_FIXTURE = {
  aiEnabled: false,
  authorityPresent: true,
  clinicalContent: false,
  promptInjectionAttempt: false,
  toolCallWithoutApproval: false,
  participantScoringAttempt: false,
  safeguardingSignal: false,
} as const;

export function signSafetyReport(payload: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

/**
 * O6 — Safety evaluation gate. Blocks merge when harness fails.
 * Does not make care, payment, or eligibility decisions.
 */
export function runCareOSSafetyGate(options?: {
  skipConfigCheck?: boolean;
}): SafetyGateReport {
  if (
    !options?.skipConfigCheck &&
    !careosOpportunitiesConfig.safetyGateEnabled
  ) {
    throw new Error("SAFETY_GATE_DISABLED");
  }

  if (careosOpportunitiesConfig.participantScoringEnabled) {
    throw new Error("PARTICIPANT_SCORING_MUST_REMAIN_DISABLED");
  }

  const previous = process.env.MAPABLE_AI_EVALUATION_HARNESS_ENABLED;
  process.env.MAPABLE_AI_EVALUATION_HARNESS_ENABLED = "true";
  let harness: EvaluationHarnessReport;
  try {
    harness = runFullEvaluationHarness({ ...SAFETY_GATE_PASSING_FIXTURE });
  } finally {
    if (previous === undefined) {
      delete process.env.MAPABLE_AI_EVALUATION_HARNESS_ENABLED;
    } else {
      process.env.MAPABLE_AI_EVALUATION_HARNESS_ENABLED = previous;
    }
  }

  const body = {
    runAt: harness.runAt,
    allPassed: harness.allPassed,
    scenarios: harness.scenarios.map((s) => ({
      id: s.scenarioId,
      passed: s.passed,
    })),
    prohibitedRegistrySize: UNIFIED_PROHIBITED_USES.length,
  };

  return {
    runAt: harness.runAt,
    allPassed: harness.allPassed,
    harness,
    prohibitedRegistrySize: UNIFIED_PROHIBITED_USES.length,
    signature: signSafetyReport(body),
    blockedCapabilitiesSample: UNIFIED_PROHIBITED_USES.slice(0, 8),
  };
}

export function assertSafetyGatePassed(report: SafetyGateReport): void {
  if (!report.allPassed) {
    throw new Error("CAREOS_SAFETY_GATE_FAILED");
  }
}
