export const companionConfig = {
  enabled: process.env.MAPABLE_COMPANION_ENABLED === "true",
  visitPackEnabled: process.env.MAPABLE_COMPANION_VISIT_PACK_ENABLED === "true",
};

export function isCompanionEnabled(): boolean {
  return companionConfig.enabled;
}

export function isCompanionVisitPackEnabled(): boolean {
  return companionConfig.enabled && companionConfig.visitPackEnabled;
}
