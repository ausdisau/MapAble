export const CAPABILITY_MATURITY = [
  "deterministic",
  "experimental",
  "synthetic_only",
  "shadow",
  "controlled_pilot",
  "production_supported",
  "suspended",
  "retired",
] as const;

export type CapabilityMaturity = (typeof CAPABILITY_MATURITY)[number];

export const PRODUCTION_CLAIM_STATUS = [
  "not_claimable",
  "internal_only",
  "pilot_disclosed",
  "public_allowed",
  "suspended",
] as const;

export type ProductionClaimStatus = (typeof PRODUCTION_CLAIM_STATUS)[number];
