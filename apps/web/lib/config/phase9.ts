export const phase9Config = {
  publicApiPartnerProgramEnabled:
    process.env.PUBLIC_API_PARTNER_PROGRAM_ENABLED === "true",
  personalDataVaultEnabled:
    process.env.PERSONAL_DATA_VAULT_ENABLED === "true",
  researchSafeRoomEnabled: process.env.RESEARCH_SAFE_ROOM_ENABLED === "true",
  publicDecisionRegisterEnabled:
    process.env.PUBLIC_DECISION_REGISTER_ENABLED === "true",
  internationalisationEnabled:
    process.env.INTERNATIONALISATION_ENABLED === "true",
  longitudinalImpactEnabled:
    process.env.LONGITUDINAL_IMPACT_ENABLED === "true",
};
