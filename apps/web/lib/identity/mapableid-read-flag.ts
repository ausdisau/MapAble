/**
 * Single MapAbleID v0.3 preview flag, reconciled with merged legacy PR #676.
 * No login authority or authentication settings are changed by this flag.
 *
 * Shadow preview is deliberately blocked in production even when true.
 */
export type MapAbleIdFlagEnvironment = {
  NODE_ENV?: string;
  MAPABLE_ID_DASHBOARD_ENABLED?: string;
};

export function isMapAbleIdReadOnlyEnabled(
  env: MapAbleIdFlagEnvironment = process.env,
): boolean {
  return (
    env.NODE_ENV !== "production" &&
    env.MAPABLE_ID_DASHBOARD_ENABLED === "true"
  );
}
