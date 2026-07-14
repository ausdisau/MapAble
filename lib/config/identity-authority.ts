function enabled(name: string) {
  return process.env[name] === "true";
}

export const identityAuthorityConfig = {
  enabled: enabled("MAPABLE_IDENTITY_AUTHORITY_ENABLED"),
  stepUpEnabled: enabled("MAPABLE_STEP_UP_AUTH_ENABLED"),
  emergencyAccessEnabled: enabled("MAPABLE_EMERGENCY_ACCESS_ENABLED"),
  delegateInvitesEnabled: enabled("MAPABLE_DELEGATE_INVITES_ENABLED"),
  /** Service accounts must never inherit participant session authority. */
  serviceAccountParticipantAuthorityEnabled: false,
  /** Financial and clinical authority never inherit from a generic delegate invite. */
  automaticFinancialAuthorityEnabled: false,
  automaticClinicalAuthorityEnabled: false,
} as const;

export const FINANCIAL_DOMAINS = ["finance", "abilitypay", "payments"] as const;
export const CLINICAL_DOMAINS = [
  "clinical",
  "home_living_clinical",
  "safeguarding",
] as const;

export function isFinancialDomain(domain: string): boolean {
  return (FINANCIAL_DOMAINS as readonly string[]).includes(domain);
}

export function isClinicalDomain(domain: string): boolean {
  return (CLINICAL_DOMAINS as readonly string[]).includes(domain);
}
