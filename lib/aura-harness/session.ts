import type {
  AgentRiskTierMapping,
  HarnessSessionSummary,
  HarnessToolEvaluation,
} from "@/lib/aura-harness/types";

export class HarnessSessionAccumulator {
  private readonly evaluations: HarnessToolEvaluation[] = [];

  record(evaluation: HarnessToolEvaluation): void {
    this.evaluations.push(evaluation);
  }

  get summary(): HarnessSessionSummary {
    let maxNormalizedGamma = 0;
    let maxConcentrationCoeff = 0;
    let requiresHITL = false;
    let anyDenied = false;
    const guardrails = new Set<string>();

    for (const { toolName, decision } of this.evaluations) {
      maxNormalizedGamma = Math.max(
        maxNormalizedGamma,
        decision.profile.normalizedGamma,
      );
      maxConcentrationCoeff = Math.max(
        maxConcentrationCoeff,
        decision.profile.concentrationCoeff,
      );
      if (decision.outcome === "HITL_PENDING") requiresHITL = true;
      if (decision.outcome === "DENIED") anyDenied = true;
      for (const id of decision.guardrailIds) {
        guardrails.add(id);
      }
      guardrails.add(`aura:${toolName}:${decision.outcome}`);
    }

    return {
      maxNormalizedGamma,
      maxConcentrationCoeff,
      requiresHITL,
      anyDenied,
      guardrails: [...guardrails],
      evaluations: this.evaluations.map(({ toolName, decision }) => ({
        toolName,
        outcome: decision.outcome,
        normalizedGamma: decision.profile.normalizedGamma,
        concentrationCoeff: decision.profile.concentrationCoeff,
        reason: decision.reason,
        recognise: decision.recognise,
      })),
    };
  }

  toRiskTier(): AgentRiskTierMapping {
    const { maxNormalizedGamma, requiresHITL, anyDenied } = this.summary;
    if (requiresHITL || maxNormalizedGamma >= 90) return "critical";
    if (anyDenied || maxNormalizedGamma > 75) return "high";
    if (maxNormalizedGamma > 40) return "medium";
    return "low";
  }

  humanReviewRequired(): boolean {
    const s = this.summary;
    return s.requiresHITL || s.anyDenied || this.toRiskTier() !== "low";
  }
}

export function createHarnessSession(): HarnessSessionAccumulator {
  return new HarnessSessionAccumulator();
}
