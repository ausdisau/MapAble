export const startingWorkPilotConfig = {
  enabled: process.env.MAPABLE_STARTING_WORK_PILOT_ENABLED === "true",
  /** Synthetic Harbour Civic Centre fixtures only unless explicitly authorised. */
  syntheticOnly: process.env.MAPABLE_STARTING_WORK_SYNTHETIC_ONLY !== "false",
};

export function isStartingWorkPilotEnabled(): boolean {
  return startingWorkPilotConfig.enabled;
}
