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
} from "@/lib/convergence-os/gates";

export {
  runRepositoryScan,
  getLatestSnapshotId,
  type RepositoryScanResult,
} from "@/lib/convergence-os/scans/repository-scan";

export {
  runTwinScan,
  type TwinScanResult,
} from "@/lib/convergence-os/scans/twin-scan";

export {
  buildTwinInventory,
  getTwinOverview,
  compareTwinHashes,
} from "@/lib/convergence-os/twin/store";

export {
  analyseSchemaCollisions,
  SCHEMA_REF_FIXTURES,
  MAIN_INDOOR_MODELS,
  modelsAreIdentical,
  isRelatedProjectionPair,
} from "@/lib/convergence-os/schema/collision-engine";

export { FOUNDATION_MERGE_TRAIN } from "@/lib/convergence-os/trains/foundation-merge-train";
export { CANONICAL_DOMAIN_SEEDS } from "@/lib/convergence-os/seed/canonical-domains";
export { CAPABILITY_SEEDS } from "@/lib/convergence-os/seed/capabilities";
export {
  PILOT_PR_SEEDS,
  PILOT_DEPENDENCY_SEEDS,
} from "@/lib/convergence-os/seed/pilot-prs";
export { DECISION_PROPOSAL_SEEDS } from "@/lib/convergence-os/seed/decisions";
export { seedIteration2 } from "@/lib/convergence-os/seed/iteration2";
export { CONSTITUTION_RULES } from "@/lib/convergence-os/constitution/rules";
export { seedArchitectureConstitution } from "@/lib/convergence-os/constitution/seed";
export { validateConstitutionAdvisory } from "@/lib/convergence-os/constitution/validate";
export {
  createExceptionDraft,
  transitionException,
  allowedTransitions,
  expireTemporaryExceptions,
} from "@/lib/convergence-os/constitution/exceptions";
export {
  SEMANTIC_CANDIDATE_SEEDS,
  seedSemanticCandidates,
} from "@/lib/convergence-os/semantic/resolver";
export { seedSyntheticPassportDoorwayLineage } from "@/lib/convergence-os/lineage/seed";
export {
  computeBlastSeverity,
  finalizeSeverity,
  runBlastSimulation,
  seedCounterfactualSimulations,
  COUNTERFACTUAL_PRESETS,
} from "@/lib/convergence-os/blast/simulator";
export { runFoundationTrainRehearsal } from "@/lib/convergence-os/rehearsal/lab";
export {
  createAgentPreflightContract,
  evaluateStopConditions,
  renderContractMarkdown,
  createPostImplementationReview,
} from "@/lib/convergence-os/agent/preflight";
export { buildConvergenceTextReport } from "@/lib/convergence-os/text-report";

export {
  evaluateAdvisoryCiFindings,
  type AdvisoryCiResult,
} from "@/lib/convergence-os/ci/advisory-gate";
