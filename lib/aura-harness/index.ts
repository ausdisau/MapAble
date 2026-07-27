export { auraHarnessConfig, isAuraHarnessEnabled } from "@/lib/aura-harness/config";
export { buildDimensions, DEFAULT_DIMENSION_WEIGHTS } from "@/lib/aura-harness/dimensions";
export {
  buildAuraBlockedToolResult,
  evaluateToolAction,
} from "@/lib/aura-harness/evaluate-action";
export { fingerprintToolCall, canonicalJson } from "@/lib/aura-harness/fingerprint";
export { GammaCalculator, gammaCalculator } from "@/lib/aura-harness/gamma-calculator";
export {
  applyMitigationLayer,
  defaultMaskPiiStrategy,
  selectMitigationForTool,
} from "@/lib/aura-harness/mitigations";
export {
  VectorMemoryStore,
  vectorMemoryStore,
  __resetAuraMemoryForTests,
} from "@/lib/aura-harness/memory-store";
export {
  policyActionReason,
  resolvePolicyAction,
} from "@/lib/aura-harness/policy-engine";
export {
  extractSemanticScores,
  reScoreAfterMitigation,
} from "@/lib/aura-harness/semantic-judge";
export {
  createHarnessSession,
  HarnessSessionAccumulator,
} from "@/lib/aura-harness/session";
export type {
  ActionContext,
  AgentRiskTierMapping,
  AuraRiskProfile,
  HarnessDecision,
  HarnessOutcome,
  HarnessSessionSummary,
  HarnessToolEvaluation,
  MemoryDecision,
  MitigationStrategy,
  PolicyAction,
  RiskDimension,
  RiskDimensionId,
} from "@/lib/aura-harness/types";
export {
  wrapToolsWithAuraHarness,
  type AuraHarnessWrapContext,
} from "@/lib/aura-harness/wrap-tools";

export {
  applyRecogniseToContexts,
  autonomyPolicyHint,
  capabilityDependenceEvaluator,
  cascadingImpactEvaluator,
  DEFAULT_AUTONOMY_EVALUATORS,
  ensureDefaultAutonomyEvaluators,
  evaluateAccreditationBridge,
  evaluateRecogniseContext,
  irreversibilityEvaluator,
  listRiskCriterionEvaluators,
  mergeAutonomyScores,
  registerRiskCriterionEvaluator,
  unregisterRiskCriterionEvaluator,
  __resetDefaultAutonomyRegistrationForTests,
  __resetRiskCriterionEvaluatorsForTests,
} from "@/lib/aura-harness/recognise";
export type {
  AccreditationTierHint,
  AutonomyCriteriaScores,
  RecogniseEvaluation,
  RiskCriterionEvaluator,
} from "@/lib/aura-harness/recognise";
