export {
  convergenceOsConfig,
  isConvergenceOsEnabled,
  isConvergenceDomainRegistryEnabled,
  isConvergenceBranchGraphEnabled,
  isConvergenceSchemaScanEnabled,
  isConvergenceMergeTrainEnabled,
  isConvergenceCapabilityCatalogueEnabled,
  isConvergenceCiGateEnabled,
  isConvergenceTwinEnabled,
  isConvergenceConstitutionEnabled,
  isConvergenceSemanticResolverEnabled,
  isConvergenceLineageEnabled,
  isConvergenceBlastRadiusEnabled,
  isConvergenceRehearsalEnabled,
  isConvergenceAgentPreflightEnabled,
  isConvergenceDriftEnabled,
  isConvergenceEnvParityEnabled,
  isConvergenceSupplyChainEnabled,
  isConvergenceOwnershipEnabled,
  isConvergenceGoldenJourneyEnabled,
  isConvergenceFederationEnabled,
  isConvergenceEnforcementActive,
  assertNoAutoMutation,
} from "@/lib/config/convergence-os";

export {
  requireConvergenceEnabled,
  requireConvergenceFeature,
  convergenceDisabledResponse,
} from "@/lib/platform/convergence-os/gates";

export {
  runRepositoryScan,
  getLatestSnapshotId,
  type RepositoryScanResult,
} from "@/lib/platform/convergence-os/scans/repository-scan";

export {
  runTwinScan,
  type TwinScanResult,
} from "@/lib/platform/convergence-os/scans/twin-scan";

export {
  buildTwinInventory,
  getTwinOverview,
  compareTwinHashes,
} from "@/lib/platform/convergence-os/twin/store";

export {
  analyseSchemaCollisions,
  SCHEMA_REF_FIXTURES,
  MAIN_INDOOR_MODELS,
  modelsAreIdentical,
  isRelatedProjectionPair,
} from "@/lib/platform/convergence-os/schema/collision-engine";

export { FOUNDATION_MERGE_TRAIN } from "@/lib/platform/convergence-os/trains/foundation-merge-train";
export { PRODUCTISATION_MERGE_TRAIN } from "@/lib/platform/convergence-os/trains/productisation-merge-train";
export { CANONICAL_DOMAIN_SEEDS } from "@/lib/platform/convergence-os/seed/canonical-domains";
export { CAPABILITY_SEEDS } from "@/lib/platform/convergence-os/seed/capabilities";
export {
  PILOT_PR_SEEDS,
  PILOT_DEPENDENCY_SEEDS,
} from "@/lib/platform/convergence-os/seed/pilot-prs";
export {
  PR_ACTION_LEDGER,
  SUPERSEDED_CLOSE_TARGETS,
  MAX_UNMERGED_STACK_DEPTH,
  PRODUCTISATION_TRAIN_HEADS,
  ledgerEntriesByAction,
  assertSupersededCloseTargetsInLedger,
  assertStackDepthPolicy,
  assertProductisationTrainDepth,
} from "@/lib/platform/convergence-os/seed/pr-action-ledger";
export {
  PUBLIC_CLAIM_REGISTRY,
  assertNoProductionClaimsWithoutEvidence,
} from "@/lib/platform/convergence-os/seed/public-claims";
export { DECISION_PROPOSAL_SEEDS } from "@/lib/platform/convergence-os/seed/decisions";
export { seedIteration2 } from "@/lib/platform/convergence-os/seed/iteration2";
export { CONSTITUTION_RULES } from "@/lib/platform/convergence-os/constitution/rules";
export { seedArchitectureConstitution } from "@/lib/platform/convergence-os/constitution/seed";
export { validateConstitutionAdvisory } from "@/lib/platform/convergence-os/constitution/validate";
export {
  createExceptionDraft,
  transitionException,
  allowedTransitions,
  expireTemporaryExceptions,
} from "@/lib/platform/convergence-os/constitution/exceptions";
export {
  SEMANTIC_CANDIDATE_SEEDS,
  seedSemanticCandidates,
} from "@/lib/platform/convergence-os/semantic/resolver";
export { seedSyntheticPassportDoorwayLineage } from "@/lib/platform/convergence-os/lineage/seed";
export {
  computeBlastSeverity,
  finalizeSeverity,
  runBlastSimulation,
  seedCounterfactualSimulations,
  COUNTERFACTUAL_PRESETS,
} from "@/lib/platform/convergence-os/blast/simulator";
export { runFoundationTrainRehearsal } from "@/lib/platform/convergence-os/rehearsal/lab";
export {
  createAgentPreflightContract,
  evaluateStopConditions,
  renderContractMarkdown,
  createPostImplementationReview,
} from "@/lib/platform/convergence-os/agent/preflight";
export { buildConvergenceTextReport } from "@/lib/platform/convergence-os/text-report";

export {
  evaluateAdvisoryCiFindings,
  type AdvisoryCiResult,
} from "@/lib/platform/convergence-os/ci/advisory-gate";
