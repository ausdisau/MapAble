/** Act layer feature flags — default off. */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true" || raw === "1";
}

export const actFlags = {
  /** NDIS draft billing calculator + export packs. */
  get layerEnabled(): boolean {
    return envFlag("MAPABLE_ACT_LAYER_ENABLED", false);
  },
  /** Agent-to-Human handoff queue from AURA HITL_PENDING. */
  get a2hHandoffEnabled(): boolean {
    return envFlag("MAPABLE_A2H_HANDOFF_ENABLED", false);
  },
};

export function isActLayerEnabled(): boolean {
  return actFlags.layerEnabled;
}

export function isA2hHandoffEnabled(): boolean {
  return actFlags.a2hHandoffEnabled && envFlag("MAPABLE_AURA_HARNESS_ENABLED", false);
}
