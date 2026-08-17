import type { AuraRiskProfile, PolicyAction } from "@/lib/aura-harness/types";

/**
 * Escalation matrix:
 * Low/Low → APPROVE
 * Low/High → MITIGATE
 * High/Low → DENY
 * High/High → REQUIRE_HITL (fail closed)
 */
export function resolvePolicyAction(profile: AuraRiskProfile): PolicyAction {
  const { highGamma, highConcentration } = profile;

  if (!highGamma && !highConcentration) return "APPROVE";
  if (!highGamma && highConcentration) return "MITIGATE";
  if (highGamma && !highConcentration) return "DENY";
  return "REQUIRE_HITL";
}

export function policyActionReason(
  action: PolicyAction,
  profile: AuraRiskProfile,
): string {
  switch (action) {
    case "APPROVE":
      return "Diffuse low risk; routine action approved.";
    case "MITIGATE":
      return `Safe on average (γ=${profile.normalizedGamma.toFixed(1)}) but concentrated risk (C_conc=${profile.concentrationCoeff.toFixed(1)}); applying mitigation.`;
    case "DENY":
      return `Uniformly high risk (γ=${profile.normalizedGamma.toFixed(1)}); execution denied.`;
    case "REQUIRE_HITL":
      return `Critical hot-spots (γ=${profile.normalizedGamma.toFixed(1)}, C_conc=${profile.concentrationCoeff.toFixed(1)}); fail-closed pending human review.`;
    default: {
      const _exhaustive: never = action;
      return _exhaustive;
    }
  }
}
