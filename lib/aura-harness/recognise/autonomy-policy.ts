import type { AutonomyCriteriaScores } from "@/lib/aura-harness/recognise/types";
import type { AuraRiskProfile, PolicyAction } from "@/lib/aura-harness/types";

const HIGH_AUTONOMY = 80;

/**
 * When irreversibility or cascading impact is acute, force fail-closed HITL
 * even if gamma matrix alone would MITIGATE/APPROVE.
 */
export function autonomyPolicyHint(
  autonomy: AutonomyCriteriaScores,
  profile: AuraRiskProfile,
): { policyHint: PolicyAction | null; reason?: string } {
  const acute =
    autonomy.irreversibility >= HIGH_AUTONOMY ||
    autonomy.cascadingImpact >= HIGH_AUTONOMY;
  const judgmentHeavy = autonomy.capabilityDependence >= HIGH_AUTONOMY;

  if (acute && (profile.highGamma || judgmentHeavy || acute)) {
    return {
      policyHint: "REQUIRE_HITL",
      reason: `Autonomy criteria elevated (irreversibility=${autonomy.irreversibility}, cascading=${autonomy.cascadingImpact}, capability=${autonomy.capabilityDependence}); fail-closed HITL.`,
    };
  }

  if (judgmentHeavy && autonomy.irreversibility >= 60) {
    return {
      policyHint: "REQUIRE_HITL",
      reason: "Capability-dependence with material irreversibility; fail-closed HITL.",
    };
  }

  return { policyHint: null };
}
