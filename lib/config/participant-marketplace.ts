function enabled(name: string) {
  return process.env[name] === "true";
}

export const participantMarketplaceConfig = {
  enabled: enabled("MAPABLE_PARTICIPANT_MARKETPLACE_ENABLED"),
  comparisonEnabled: enabled("MAPABLE_PROVIDER_COMPARISON_ENABLED"),
  supportCoordinationEnabled: enabled("MAPABLE_SUPPORT_COORDINATION_ENABLED"),
  serviceAgreementsEnabled: enabled("MAPABLE_SERVICE_AGREEMENTS_ENABLED"),
  messagingEnabled: enabled("MAPABLE_MARKETPLACE_MESSAGING_ENABLED"),
  sponsoredRankingEnabled: false,
  automaticProviderSelectionEnabled: false,
  automaticAgreementAcceptanceEnabled: false,
} as const;
