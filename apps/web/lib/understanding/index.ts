export { isUnderstandingEnabled, understandingConfig } from "@/lib/config/understanding";
export {
  buildParticipantKnowledgeGraph,
  ensureUnderstandingContext,
  linkGraphEntities,
} from "@/lib/understanding/knowledge-graph-service";
export {
  deleteInformalSupport,
  listInformalSupports,
  upsertInformalSupport,
} from "@/lib/understanding/informal-support-service";
export {
  computeLivingArrangementRiskSignal,
  getLivingArrangementRiskSignal,
} from "@/lib/understanding/relationship-risk-service";
export {
  defaultInformalSupportRiskEvaluator,
  ensureDefaultRelationshipRiskEvaluators,
  listRelationshipRiskEvaluators,
  registerRelationshipRiskEvaluator,
  unregisterRelationshipRiskEvaluator,
  __resetDefaultRelationshipRiskRegistrationForTests,
  __resetRelationshipRiskEvaluatorsForTests,
} from "@/lib/understanding/evaluators";
export {
  createUnderstandingAgent,
  runUnderstandingAgentTurn,
  UNDERSTANDING_CAPABILITY_KEY,
} from "@/lib/understanding/understanding-agent";
export { ensureUnderstandingRecogniseBridge } from "@/lib/understanding/recognise-bridge";
export type {
  InformalSupportView,
  LivingArrangementSignalView,
  ParticipantKnowledgeGraph,
  RelationshipRiskEvaluator,
  StabilityTrend,
  UnderstandingEntityType,
} from "@/lib/understanding/types";
