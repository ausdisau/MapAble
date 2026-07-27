import type { RelationshipRiskEvaluator } from "@/lib/understanding/types";

const evaluators = new Map<string, RelationshipRiskEvaluator>();

export function registerRelationshipRiskEvaluator(
  evaluator: RelationshipRiskEvaluator,
): void {
  evaluators.set(evaluator.id, evaluator);
}

export function unregisterRelationshipRiskEvaluator(id: string): void {
  evaluators.delete(id);
}

export function listRelationshipRiskEvaluators(): RelationshipRiskEvaluator[] {
  return [...evaluators.values()];
}

export function __resetRelationshipRiskEvaluatorsForTests(): void {
  evaluators.clear();
}

/** Default heuristic — declining informal capacity elevates cascading risk. */
export const defaultInformalSupportRiskEvaluator: RelationshipRiskEvaluator = {
  id: "understanding.informal_support_decline",
  evaluate({ informalSupports, livingAloneHint }) {
    if (informalSupports.length === 0) {
      return {
        cascadingImpact: livingAloneHint ? 55 : 25,
        capabilityDependence: 20,
      };
    }
    const declining = informalSupports.filter(
      (s) => s.stabilityTrend === "declining",
    );
    const avgCapacity =
      informalSupports.reduce((sum, s) => sum + s.capacityScore, 0) /
      informalSupports.length;

    let cascadingImpact = 20;
    if (declining.length > 0 && avgCapacity < 50) {
      cascadingImpact = 85;
    } else if (declining.length > 0 || avgCapacity < 40) {
      cascadingImpact = 70;
    } else if (avgCapacity < 60) {
      cascadingImpact = 45;
    }

    if (livingAloneHint && cascadingImpact < 70) {
      cascadingImpact = Math.max(cascadingImpact, 65);
    }

    return {
      cascadingImpact,
      capabilityDependence: avgCapacity < 40 ? 60 : 30,
      irreversibility: declining.length > 0 ? 55 : 25,
    };
  },
};

let defaultsRegistered = false;

export function ensureDefaultRelationshipRiskEvaluators(): void {
  if (defaultsRegistered) return;
  registerRelationshipRiskEvaluator(defaultInformalSupportRiskEvaluator);
  defaultsRegistered = true;
}

export function __resetDefaultRelationshipRiskRegistrationForTests(): void {
  defaultsRegistered = false;
}
