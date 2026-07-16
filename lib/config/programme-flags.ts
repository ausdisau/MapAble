import type { ProgrammeId } from "@/lib/programmes/safety-invariants";

export const programmeFlagsConfig = {
  pathwaysEnabled: process.env.MAPABLE_PATHWAYS_ENABLED === "true",
  transitionHomeEnabled: process.env.MAPABLE_TRANSITION_HOME_ENABLED === "true",
  kidsEnabled: process.env.MAPABLE_KIDS_ENABLED === "true",
  lifespanEnabled: process.env.MAPABLE_LIFESPAN_ENABLED === "true",
  homeEnabled: process.env.MAPABLE_HOME_ENABLED === "true",
  atLifecycleEnabled: process.env.MAPABLE_AT_LIFECYCLE_ENABLED === "true",
  workRetentionEnabled: process.env.MAPABLE_WORK_RETENTION_ENABLED === "true",
  carerContinuityEnabled:
    process.env.MAPABLE_CARER_CONTINUITY_ENABLED === "true",
  regionalCapacityEnabled:
    process.env.MAPABLE_REGIONAL_CAPACITY_ENABLED === "true",
  rightsNavigatorEnabled:
    process.env.MAPABLE_RIGHTS_NAVIGATOR_ENABLED === "true",
  integrationFoundryEnabled:
    process.env.MAPABLE_INTEGRATION_FOUNDRY_ENABLED === "true",
  dataCooperativeEnabled:
    process.env.MAPABLE_DATA_COOPERATIVE_ENABLED === "true",
} as const;

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
  return programmeFlagsConfig[PROGRAMME_FLAG_MAP[programmeId]];
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
