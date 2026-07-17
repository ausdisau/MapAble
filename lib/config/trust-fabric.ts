/**
 * Trust Fabric flags — purpose-bound access receipts and participant history.
 * All default off — not evidence of a production trust network.
 */
export const trustFabricConfig = {
  enabled: process.env.MAPABLE_TRUST_FABRIC_ENABLED === "true",
  accessHistoryEnabled:
    process.env.MAPABLE_PARTICIPANT_ACCESS_HISTORY_ENABLED === "true",
  /** Permanent: AI never holds consequential decision authority via this module. */
  aiDecisionAuthorityEnabled: false,
  /** Permanent: no automatic authority grants. */
  automaticAuthorityEnabled: false,
  publicClaimState: "internal_alpha" as const,
};

export function isTrustFabricEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return env.MAPABLE_TRUST_FABRIC_ENABLED === "true";
}

export function isParticipantAccessHistoryEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    env.MAPABLE_TRUST_FABRIC_ENABLED === "true" &&
    env.MAPABLE_PARTICIPANT_ACCESS_HISTORY_ENABLED === "true"
  );
}
