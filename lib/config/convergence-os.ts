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
 * ConvergenceOS feature flags.
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
