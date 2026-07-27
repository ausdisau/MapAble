function enabled(name: string, fallback = false) {
  const value = process.env[name];
  return value === undefined ? fallback : value === "true";
}

export const providerWorkforceConfig = {
  providerCloudEnabled: enabled("MAPABLE_PROVIDER_CLOUD_ENABLED"),
  workerCloudEnabled: enabled("MAPABLE_WORKER_CLOUD_ENABLED"),
  workerMatchingEnabled: enabled("MAPABLE_WORKER_MATCHING_ENABLED"),
  continuityRecoveryEnabled: enabled("MAPABLE_CONTINUITY_RECOVERY_ENABLED"),
  shiftNoteAssistantEnabled: enabled("MAPABLE_SHIFT_NOTE_ASSISTANT_ENABLED"),
  automaticAssignmentEnabled: false,
} as const;
