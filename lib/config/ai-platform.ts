/** Governed AI platform foundation flags. All new UX/model features default off. */

function envFlag(name: string, defaultEnabled = false): boolean {
  const raw = process.env[name];
  if (raw === undefined) return defaultEnabled;
  return raw === "true";
}

export const aiPlatformConfig = {
  /** Master switch for registry/gateway enforcement on new call sites. */
  enabled: envFlag("MAPABLE_AI_PLATFORM_ENABLED", false),
  /** Allow model-backed generation through the gateway. */
  modelGenerationEnabled: envFlag("MAPABLE_AI_MODEL_GENERATION_ENABLED", false),
  /** Shadow evaluation mode (no production writes). */
  shadowEvaluationEnabled: envFlag("MAPABLE_AI_SHADOW_EVAL_ENABLED", false),
  /** Controlled pilot surfaces. */
  controlledPilotEnabled: envFlag("MAPABLE_AI_CONTROLLED_PILOT_ENABLED", false),
  /** Public marketing claim gate for AI product language. */
  publicClaimEnabled: envFlag("MAPABLE_AI_PUBLIC_CLAIM_ENABLED", false),
  /** Global kill switch — blocks all model gateway calls when true. */
  globalKillSwitch: envFlag("MAPABLE_AI_GLOBAL_KILL_SWITCH", false),
};

export function isAiPlatformFoundationEnabled(): boolean {
  return aiPlatformConfig.enabled && !aiPlatformConfig.globalKillSwitch;
}
