export const phase6Config = {
  mobileProductionReadinessEnabled:
    process.env.MOBILE_PRODUCTION_READINESS_ENABLED === "true",
  dispatchConsoleEnabled: process.env.DISPATCH_CONSOLE_ENABLED === "true",
  providerQualityDashboardEnabled:
    process.env.PROVIDER_QUALITY_DASHBOARD_ENABLED === "true",
  aiGovernanceEnabled: process.env.AI_GOVERNANCE_ENABLED === "true",
  partnerSandboxEnabled: process.env.PARTNER_SANDBOX_ENABLED === "true",
  openDataExportEnabled: process.env.OPEN_DATA_EXPORT_ENABLED === "true",
  governmentReportingEnabled:
    process.env.GOVERNMENT_REPORTING_ENABLED === "true",
  disasterRecoveryExercisesEnabled:
    process.env.DISASTER_RECOVERY_EXERCISES_ENABLED === "true",
  communityGovernanceEnabled:
    process.env.COMMUNITY_GOVERNANCE_ENABLED === "true",
};
