/** Edge AI Capability Broker flags. All default false. No App Store AI claims. */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const edgeAiConfig = {
  get enabled() {
    return envFlag("MAPABLE_EDGE_AI_ENABLED", false);
  },
  get onDeviceEnabled() {
    return envFlag("MAPABLE_ON_DEVICE_AI_ENABLED", false);
  },
  get cloudFallbackEnabled() {
    return envFlag("MAPABLE_CLOUD_AI_FALLBACK_ENABLED", false);
  },
  authorityCeiling: "READ_ONLY_EXPLAIN" as const,
  publicAppStoreClaim: false as const,
};
