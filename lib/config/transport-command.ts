function enabled(name: string, fallback = false) {
  const value = process.env[name];
  return value === undefined ? fallback : value === "true";
}

export const transportCommandConfig = {
  commandCentreEnabled: enabled("MAPABLE_TRANSPORT_COMMAND_ENABLED"),
  continuityRecoveryEnabled: enabled("MAPABLE_TRANSPORT_CONTINUITY_RECOVERY_ENABLED"),
  publicTransitAdaptersEnabled: enabled(
    "MAPABLE_TRANSPORT_PUBLIC_TRANSIT_ADAPTERS_ENABLED"
  ),
  /** Hardcoded false — silent substitution is never permitted. */
  autoSubstitutionEnabled: false as const,
} as const;

export function isTransportCommandEnabled(): boolean {
  return transportCommandConfig.commandCentreEnabled;
}
