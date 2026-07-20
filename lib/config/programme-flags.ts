import type { ProgrammeId } from "@/lib/programmes/safety-invariants";

function envFlag(name: string): boolean {
  return process.env[name] === "true";
}

/**
 * Programme foundation flags — server-side only, default false.
 * A flag does not grant entitlement, authority, or production claims.
 */
export const programmeFlagsConfig = {
  get pathwaysEnabled() {
    return envFlag("MAPABLE_PATHWAYS_ENABLED");
  },
  get transitionHomeEnabled() {
    return envFlag("MAPABLE_TRANSITION_HOME_ENABLED");
  },
  get kidsEnabled() {
    return envFlag("MAPABLE_KIDS_ENABLED");
  },
  get lifespanEnabled() {
    return envFlag("MAPABLE_LIFESPAN_ENABLED");
  },
  get homeEnabled() {
    return envFlag("MAPABLE_HOME_ENABLED");
  },
  get atLifecycleEnabled() {
    return envFlag("MAPABLE_AT_LIFECYCLE_ENABLED");
  },
  get workRetentionEnabled() {
    return envFlag("MAPABLE_WORK_RETENTION_ENABLED");
  },
  get carerContinuityEnabled() {
    return envFlag("MAPABLE_CARER_CONTINUITY_ENABLED");
  },
  get regionalCapacityEnabled() {
    return envFlag("MAPABLE_REGIONAL_CAPACITY_ENABLED");
  },
  get rightsNavigatorEnabled() {
    return envFlag("MAPABLE_RIGHTS_NAVIGATOR_ENABLED");
  },
  get integrationFoundryEnabled() {
    return envFlag("MAPABLE_INTEGRATION_FOUNDRY_ENABLED");
  },
  get dataCooperativeEnabled() {
    return envFlag("MAPABLE_DATA_COOPERATIVE_ENABLED");
  },
  productionClaimStatus: "not_claimable" as const,
};

const PROGRAMME_FLAG_MAP: Record<
  ProgrammeId,
  keyof typeof programmeFlagsConfig
> = {
  pathways: "pathwaysEnabled",
  transition_home: "transitionHomeEnabled",
  kids: "kidsEnabled",
  lifespan: "lifespanEnabled",
  home: "homeEnabled",
  at_lifecycle: "atLifecycleEnabled",
  work_retention: "workRetentionEnabled",
  carer_continuity: "carerContinuityEnabled",
  regional_capacity: "regionalCapacityEnabled",
  rights_navigator: "rightsNavigatorEnabled",
  integration_foundry: "integrationFoundryEnabled",
  data_cooperative: "dataCooperativeEnabled",
};

export class ProgrammeDisabledError extends Error {
  constructor(public readonly programmeId: ProgrammeId) {
    super(`Programme '${programmeId}' is disabled`);
    this.name = "ProgrammeDisabledError";
  }
}

export function isProgrammeEnabled(programmeId: ProgrammeId): boolean {
  const key = PROGRAMME_FLAG_MAP[programmeId];
  const value = programmeFlagsConfig[key];
  return typeof value === "boolean" ? value : false;
}

export function requireProgrammeEnabled(programmeId: ProgrammeId): void {
  if (!isProgrammeEnabled(programmeId)) {
    throw new ProgrammeDisabledError(programmeId);
  }
}

export function getProgrammeEnvVar(programmeId: ProgrammeId): string {
  const envMap: Record<ProgrammeId, string> = {
    pathways: "MAPABLE_PATHWAYS_ENABLED",
    transition_home: "MAPABLE_TRANSITION_HOME_ENABLED",
    kids: "MAPABLE_KIDS_ENABLED",
    lifespan: "MAPABLE_LIFESPAN_ENABLED",
    home: "MAPABLE_HOME_ENABLED",
    at_lifecycle: "MAPABLE_AT_LIFECYCLE_ENABLED",
    work_retention: "MAPABLE_WORK_RETENTION_ENABLED",
    carer_continuity: "MAPABLE_CARER_CONTINUITY_ENABLED",
    regional_capacity: "MAPABLE_REGIONAL_CAPACITY_ENABLED",
    rights_navigator: "MAPABLE_RIGHTS_NAVIGATOR_ENABLED",
    integration_foundry: "MAPABLE_INTEGRATION_FOUNDRY_ENABLED",
    data_cooperative: "MAPABLE_DATA_COOPERATIVE_ENABLED",
  };
  return envMap[programmeId];
}
