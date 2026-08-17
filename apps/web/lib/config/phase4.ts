export const phase4Config = {
  transportLiveLocationEnabled:
    process.env.TRANSPORT_LIVE_LOCATION_ENABLED === "true",
  transportManualTrackingEnabled:
    process.env.TRANSPORT_MANUAL_TRACKING_ENABLED === "true",
  matchingEngineEnabled: process.env.MATCHING_ENGINE_ENABLED === "true",
  matchingAllowAdminOverride:
    process.env.MATCHING_ALLOW_ADMIN_OVERRIDE === "true",
  ndisSupportItemImportEnabled:
    process.env.NDIS_SUPPORT_ITEM_IMPORT_ENABLED === "true",
  ndisAutoClaimingEnabled: process.env.NDIS_AUTO_CLAIMING_ENABLED === "true",
  smartContractRunnerEnabled:
    process.env.SMART_CONTRACT_RUNNER_ENABLED === "true",
  contractsRequireAdminForChanges:
    process.env.CONTRACTS_REQUIRE_ADMIN_FOR_CHANGES !== "false",
  incidentReportingEnabled: process.env.INCIDENT_REPORTING_ENABLED === "true",
  incidentExternalReportingEnabled:
    process.env.INCIDENT_EXTERNAL_REPORTING_ENABLED === "true",
  adminAnalyticsEnabled: process.env.ADMIN_ANALYTICS_ENABLED === "true",
  serviceAgreementRequiredForRepeat:
    process.env.SERVICE_AGREEMENT_REQUIRED_FOR_REPEAT === "true",
};
