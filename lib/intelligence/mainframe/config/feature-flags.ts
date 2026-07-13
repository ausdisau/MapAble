function enabled(name: string): boolean {
  return process.env[name] === "true";
}

export const mainframeFeatureFlags = {
  enabled: enabled("MAPABLE_CORE_INTELLIGENCE_MAINFRAME_ENABLED"),
  syntheticOnly: process.env.MAPABLE_CORE_INTELLIGENCE_SYNTHETIC_ONLY !== "false",
  adminSandboxEnabled: enabled(
    "MAPABLE_CORE_INTELLIGENCE_MAINFRAME_ADMIN_SANDBOX_ENABLED"
  ),
} as const;

export function isSyntheticMainframeEnabled(): boolean {
  return mainframeFeatureFlags.enabled && mainframeFeatureFlags.syntheticOnly;
}
