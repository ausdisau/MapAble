export {
  convergenceOsConfig,
  isConvergenceOsEnabled,
  isConvergenceDomainRegistryEnabled,
  isConvergenceBranchGraphEnabled,
  isConvergenceSchemaScanEnabled,
  isConvergenceMergeTrainEnabled,
  isConvergenceCapabilityCatalogueEnabled,
  isConvergenceCiGateEnabled,
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
export { buildConvergenceTextReport } from "@/lib/convergence-os/text-report";

export {
  evaluateAdvisoryCiFindings,
  type AdvisoryCiResult,
} from "@/lib/convergence-os/ci/advisory-gate";
