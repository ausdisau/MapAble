export {
  capabilityDependenceEvaluator,
  cascadingImpactEvaluator,
  DEFAULT_AUTONOMY_EVALUATORS,
  irreversibilityEvaluator,
  mergeAutonomyScores,
} from "@/lib/aura-harness/recognise/autonomy-criteria";
export { autonomyPolicyHint } from "@/lib/aura-harness/recognise/autonomy-policy";
export { evaluateAccreditationBridge } from "@/lib/aura-harness/recognise/accreditation-bridge";
export {
  listRiskCriterionEvaluators,
  registerRiskCriterionEvaluator,
  unregisterRiskCriterionEvaluator,
  __resetRiskCriterionEvaluatorsForTests,
} from "@/lib/aura-harness/recognise/evaluator-registry";
export {
  applyRecogniseToContexts,
  ensureDefaultAutonomyEvaluators,
  evaluateRecogniseContext,
  __resetDefaultAutonomyRegistrationForTests,
} from "@/lib/aura-harness/recognise/pipeline";
export type {
  AccreditationTierHint,
  AutonomyCriteriaScores,
  RecogniseEvaluation,
  RiskCriterionEvaluator,
} from "@/lib/aura-harness/recognise/types";
