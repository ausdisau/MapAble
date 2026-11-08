/**
 * Shadow-stage account display only. Production is deliberately hard-disabled
 * until accessibility, incident/recovery and identity-authority release gates pass.
 */
export type MapAbleIdFlagEnvironment = {
  NODE_ENV?: string;
  MAPABLEID_READ_ONLY_ENABLED?: string;
};

export function isMapAbleIdReadOnlyEnabled(
  env: MapAbleIdFlagEnvironment = process.env,
): boolean {
  return (
    env.NODE_ENV !== "production" &&
    env.MAPABLEID_READ_ONLY_ENABLED === "true"
  );
}
