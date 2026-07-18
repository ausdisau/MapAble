export {
  listAiCapabilities,
  getAiCapability,
  requireAiCapability,
  listDeterministicCapabilities,
  listModelBackedCapabilities,
  assertHonestPublicLabel,
} from "./capabilities/registry";
export type { AiCapabilityRegistration } from "./capabilities/types";
export {
  resolveModelForCapability,
  guardStructuredInput,
} from "./models/gateway";
export { listModels, getModel, isModelAllowedForTask } from "./models/registry";
export { listPrompts, getPrompt, isPromptPubliclyExposable } from "./prompts/registry";
export {
  assertModelCallAllowed,
  engageCapabilityKillSwitch,
  clearCapabilityKillSwitch,
  isCapabilityKilled,
} from "./policies/kill-switches";
export {
  isProposalApproved,
  assertApprovalBindingComplete,
  HUMAN_REVIEW_STATES,
} from "./human-review/contracts";
export type { HumanReviewState, ProposalApprovalBinding } from "./human-review/contracts";
export {
  separateConflictingAccounts,
} from "./context/envelope";
export type {
  EvidenceEnvelope,
  GroundedAnswer,
  GroundedAnswerPart,
} from "./context/envelope";
export { AUTHORITY_CEILINGS, PROHIBITED_AUTONOMOUS_ACTIONS } from "./types/authority";
export { DATA_CLASSES, OUTPUT_PROVENANCE } from "./types/classification";
export { CAPABILITY_MATURITY } from "./types/maturity";
export { getAlgorithmRegisterRefForCapability } from "./authority/algorithm-register-adapter";
export { captureAiPlatformTelemetry } from "./telemetry/adapter";
export { redactSensitiveText } from "./redaction/sensitive";
export {
  EVAL_SCENARIOS,
  runAiEvaluationSuite,
  runEvalScenario,
  EVAL_DIMENSIONS,
} from "./evaluations";
export {
  createSyntheticIntakeSession,
  beginIntakeReview,
  applyIntakeReview,
  attemptApprovedCanonicalWrite,
  canTransitionIntakeStatus,
  sourceTextLooksLikeInjection,
  SYNTHETIC_INTAKE_FIXTURES,
} from "./intake";
export type {
  IntakeDocument,
  ExtractionCandidate,
  IntakeProvenanceReceipt,
  IntakeSession,
} from "./intake";
