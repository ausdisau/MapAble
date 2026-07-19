export const startingWorkPilotConfig = {
  get enabled() {
    return process.env.MAPABLE_STARTING_WORK_PILOT_ENABLED === "true";
  },
  /** Synthetic Harbour Civic Centre fixtures only unless explicitly authorised. */
  get syntheticOnly() {
    return process.env.MAPABLE_STARTING_WORK_SYNTHETIC_ONLY !== "false";
  },
  /** Persist StartingWorkJourneyProjection (default off). */
  get dbPersistence() {
    return process.env.MAPABLE_STARTING_WORK_DB_PERSISTENCE_ENABLED === "true";
  },
  authorityCeiling: "SYNTHETIC_PILOT_ONLY" as const,
  productionClaimStatus: "not_claimable" as const,
  maturity: "controlled_pilot" as const,
  /** Honesty: simulation ≠ live booking / CareOSMission SoR. */
  isLiveBookingEngine: false as const,
};

export function isStartingWorkPilotEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.MAPABLE_STARTING_WORK_PILOT_ENABLED === "true";
}

export function isStartingWorkDbPersistenceEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    env.MAPABLE_STARTING_WORK_PILOT_ENABLED === "true" &&
    env.MAPABLE_STARTING_WORK_DB_PERSISTENCE_ENABLED === "true"
  );
}
