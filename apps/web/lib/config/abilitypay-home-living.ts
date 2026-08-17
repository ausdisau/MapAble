function enabled(name: string) {
  return process.env[name] === "true";
}

export const abilityPayConfig = {
  enabled: enabled("MAPABLE_ABILITYPAY_ENABLED"),
  reconciliationEnabled: enabled("MAPABLE_INVOICE_RECONCILIATION_ENABLED"),
  accountingExportEnabled: enabled("MAPABLE_ACCOUNTING_EXPORT_ENABLED"),
  paymentExecutionEnabled: false,
  ndisClaimSubmissionEnabled: false,
} as const;

export const homeLivingConfig = {
  enabled: enabled("MAPABLE_HOME_LIVING_ENABLED"),
  sdaMarketplaceEnabled: enabled("MAPABLE_SDA_MARKETPLACE_ENABLED"),
  silCoordinationEnabled: enabled("MAPABLE_SIL_COORDINATION_ENABLED"),
  highIntensityGovernanceEnabled: enabled(
    "MAPABLE_HIGH_INTENSITY_GOVERNANCE_ENABLED",
  ),
  clinicalAiDecisionsEnabled: false,
  automaticSafeguardingDecisionsEnabled: false,
  restrictivePracticeAiEnabled: false,
} as const;
