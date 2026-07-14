function enabled(name: string) {
  return process.env[name] === "true";
}

/**
 * CareOS Phase 13 — Mobile, Voice and Communication Access feature flags.
 * All capabilities fail closed unless explicitly enabled.
 * Speech difficulty is never treated as reduced capacity.
 */
export const mobileCommunicationConfig = {
  pwaOfflineEnabled: enabled("MAPABLE_PWA_OFFLINE_ENABLED"),
  mobilePushEnabled: enabled("MAPABLE_MOBILE_PUSH_ENABLED"),
  aacCommunicationEnabled: enabled("MAPABLE_AAC_COMMUNICATION_ENABLED"),
  voiceCommandsEnabled: enabled("MAPABLE_VOICE_COMMANDS_ENABLED"),
  /** Safety: consequential voice actions always require accessible confirmation. */
  voiceBypassConfirmationEnabled: false,
  /** Safety: speech difficulty must never imply reduced decision-making capacity. */
  speechDifficultyImpliesCapacityReduction: false,
} as const;

export type MobileCommunicationConfig = typeof mobileCommunicationConfig;

export function ensurePwaOfflineEnabled() {
  if (!mobileCommunicationConfig.pwaOfflineEnabled) {
    throw new Error("PWA_OFFLINE_DISABLED");
  }
}

export function ensureAacCommunicationEnabled() {
  if (!mobileCommunicationConfig.aacCommunicationEnabled) {
    throw new Error("AAC_COMMUNICATION_DISABLED");
  }
}

export function ensureVoiceCommandsEnabled() {
  if (!mobileCommunicationConfig.voiceCommandsEnabled) {
    throw new Error("VOICE_COMMANDS_DISABLED");
  }
}

export function ensureMobilePushEnabled() {
  if (!mobileCommunicationConfig.mobilePushEnabled) {
    throw new Error("MOBILE_PUSH_DISABLED");
  }
}
