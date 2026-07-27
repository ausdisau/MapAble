import type { RiskCriterionEvaluator } from "@/lib/aura-harness/recognise/types";

const evaluators = new Map<string, RiskCriterionEvaluator>();

export function registerRiskCriterionEvaluator(
  evaluator: RiskCriterionEvaluator,
): void {
  evaluators.set(evaluator.id, evaluator);
}

export function unregisterRiskCriterionEvaluator(id: string): void {
  evaluators.delete(id);
}

export function listRiskCriterionEvaluators(): RiskCriterionEvaluator[] {
  return [...evaluators.values()];
}

export function __resetRiskCriterionEvaluatorsForTests(): void {
  evaluators.clear();
}
