export const phase8Config = {
  appStoreReleaseProcessEnabled:
    process.env.APP_STORE_RELEASE_PROCESS_ENABLED === "true",
  nationalInsightsEnabled: process.env.NATIONAL_INSIGHTS_ENABLED === "true",
  partnerMarketplaceEnabled: process.env.PARTNER_MARKETPLACE_ENABLED === "true",
  publicApiVersioningEnabled:
    process.env.PUBLIC_API_VERSIONING_ENABLED === "true",
  slaReportingEnabled: process.env.SLA_REPORTING_ENABLED === "true",
  externalSecurityAuditReadinessEnabled:
    process.env.EXTERNAL_SECURITY_AUDIT_READINESS_ENABLED === "true",
  dataTrustCouncilEnabled: process.env.DATA_TRUST_COUNCIL_ENABLED === "true",
};
