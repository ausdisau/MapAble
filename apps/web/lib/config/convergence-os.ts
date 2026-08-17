export type ConvergenceMode = "audit" | "advisory" | "gated" | "enforced";

function envTrue(name: string): boolean {
  return process.env[name] === "true";
}

function envMode(): ConvergenceMode {
  const raw = (process.env.MAPABLE_CONVERGENCE_MODE ?? "audit").toLowerCase();
  if (
    raw === "audit" ||
    raw === "advisory" ||
    raw === "gated" ||
    raw === "enforced"
  ) {
    return raw;
  }
  return "audit";
}

/**
 * ConvergenceOS feature flags (Wave 0 + Iteration 2).
 * Safe defaults: disabled, audit mode, no auto-merge / auto-migration / auto-delete.
 * Client input must never enable server authority.
 */
export const convergenceOsConfig = {
  enabled: envTrue("MAPABLE_CONVERGENCE_OS_ENABLED"),
  mode: envMode(),
  domainRegistryEnabled: envTrue("MAPABLE_CONVERGENCE_DOMAIN_REGISTRY_ENABLED"),
  capabilityCatalogueEnabled: envTrue(
    "MAPABLE_CONVERGENCE_CAPABILITY_CATALOGUE_ENABLED"
  ),
  branchGraphEnabled: envTrue("MAPABLE_CONVERGENCE_BRANCH_GRAPH_ENABLED"),
  schemaScanEnabled: envTrue("MAPABLE_CONVERGENCE_SCHEMA_SCAN_ENABLED"),
  flagScanEnabled: envTrue("MAPABLE_CONVERGENCE_FLAG_SCAN_ENABLED"),
  contractScanEnabled: envTrue("MAPABLE_CONVERGENCE_CONTRACT_SCAN_ENABLED"),
  mergeTrainEnabled: envTrue("MAPABLE_CONVERGENCE_MERGE_TRAIN_ENABLED"),
  claimRegistryEnabled: envTrue("MAPABLE_CONVERGENCE_CLAIM_REGISTRY_ENABLED"),
  releasePacksEnabled: envTrue("MAPABLE_CONVERGENCE_RELEASE_PACKS_ENABLED"),
  ciGateEnabled: envTrue("MAPABLE_CONVERGENCE_CI_GATE_ENABLED"),
  // Iteration 2
  constitutionEnabled: envTrue("MAPABLE_CONVERGENCE_CONSTITUTION_ENABLED"),
  twinEnabled: envTrue("MAPABLE_CONVERGENCE_TWIN_ENABLED"),
  semanticResolverEnabled: envTrue(
    "MAPABLE_CONVERGENCE_SEMANTIC_RESOLVER_ENABLED"
  ),
  lineageEnabled: envTrue("MAPABLE_CONVERGENCE_LINEAGE_ENABLED"),
  blastRadiusEnabled: envTrue("MAPABLE_CONVERGENCE_BLAST_RADIUS_ENABLED"),
  rehearsalEnabled: envTrue("MAPABLE_CONVERGENCE_REHEARSAL_ENABLED"),
  agentPreflightEnabled: envTrue(
    "MAPABLE_CONVERGENCE_AGENT_PREFLIGHT_ENABLED"
  ),
  driftEnabled: envTrue("MAPABLE_CONVERGENCE_DRIFT_ENABLED"),
  envParityEnabled: envTrue("MAPABLE_CONVERGENCE_ENV_PARITY_ENABLED"),
  supplyChainEnabled: envTrue("MAPABLE_CONVERGENCE_SUPPLY_CHAIN_ENABLED"),
  ownershipEnabled: envTrue("MAPABLE_CONVERGENCE_OWNERSHIP_ENABLED"),
  goldenJourneyEnabled: envTrue("MAPABLE_CONVERGENCE_GOLDEN_JOURNEY_ENABLED"),
  federationEnabled: envTrue("MAPABLE_CONVERGENCE_FEDERATION_ENABLED"),
  /** Permanently advisory-safe — never auto-mutate repository state. */
  autoMergeEnabled: false,
  autoMigrationEnabled: false,
  autoDeleteEnabled: false,
  autoFlagChangeEnabled: false,
} as const;

export function isConvergenceOsEnabled(): boolean {
  return convergenceOsConfig.enabled;
}

export function isConvergenceDomainRegistryEnabled(): boolean {
  return (
    convergenceOsConfig.enabled && convergenceOsConfig.domainRegistryEnabled
  );
}

export function isConvergenceBranchGraphEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.branchGraphEnabled;
}

export function isConvergenceSchemaScanEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.schemaScanEnabled;
}

export function isConvergenceMergeTrainEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.mergeTrainEnabled;
}

export function isConvergenceCapabilityCatalogueEnabled(): boolean {
  return (
    convergenceOsConfig.enabled &&
    convergenceOsConfig.capabilityCatalogueEnabled
  );
}

export function isConvergenceCiGateEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.ciGateEnabled;
}

export function isConvergenceTwinEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.twinEnabled;
}

export function isConvergenceConstitutionEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.constitutionEnabled;
}

export function isConvergenceSemanticResolverEnabled(): boolean {
  return (
    convergenceOsConfig.enabled && convergenceOsConfig.semanticResolverEnabled
  );
}

export function isConvergenceLineageEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.lineageEnabled;
}

export function isConvergenceBlastRadiusEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.blastRadiusEnabled;
}

export function isConvergenceRehearsalEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.rehearsalEnabled;
}

export function isConvergenceAgentPreflightEnabled(): boolean {
  return (
    convergenceOsConfig.enabled && convergenceOsConfig.agentPreflightEnabled
  );
}

export function isConvergenceDriftEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.driftEnabled;
}

export function isConvergenceEnvParityEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.envParityEnabled;
}

export function isConvergenceSupplyChainEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.supplyChainEnabled;
}

export function isConvergenceOwnershipEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.ownershipEnabled;
}

export function isConvergenceGoldenJourneyEnabled(): boolean {
  return (
    convergenceOsConfig.enabled && convergenceOsConfig.goldenJourneyEnabled
  );
}

export function isConvergenceFederationEnabled(): boolean {
  return convergenceOsConfig.enabled && convergenceOsConfig.federationEnabled;
}

/** Enforcement mode is never active unless explicitly set AND CI gate enabled. */
export function isConvergenceEnforcementActive(): boolean {
  return (
    convergenceOsConfig.enabled &&
    convergenceOsConfig.ciGateEnabled &&
    convergenceOsConfig.mode === "enforced"
  );
}

export function assertNoAutoMutation(): void {
  if (
    convergenceOsConfig.autoMergeEnabled ||
    convergenceOsConfig.autoMigrationEnabled ||
    convergenceOsConfig.autoDeleteEnabled ||
    convergenceOsConfig.autoFlagChangeEnabled
  ) {
    throw new Error(
      "ConvergenceOS auto-mutation flags must remain disabled in this release"
    );
  }
}
