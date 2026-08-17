import { y1WedgeConfig } from "@/lib/config/y1-wedge";

/**
 * Y2 orchestration flags. All default false in .env.example.
 * BACKUP_RECOVERY_PILOT_ENABLED supersedes BACKUP_SHIFT_RECOVERY_ENABLED when on.
 * MICRO_CONSENT_V2_ENABLED extends Y1 micro-consent when on.
 */
export const y2OrchestrationConfig = {
  backupRecoveryPilotEnabled:
    process.env.BACKUP_RECOVERY_PILOT_ENABLED === "true",
  careTransportOrchestrationV2Enabled:
    process.env.CARE_TRANSPORT_ORCHESTRATION_V2_ENABLED === "true",
  microConsentV2Enabled: process.env.MICRO_CONSENT_V2_ENABLED === "true",
  planManagerIntegrationEnabled:
    process.env.PLAN_MANAGER_INTEGRATION_ENABLED === "true",
  supportCoordinatorPortalEnabled:
    process.env.SUPPORT_COORDINATOR_PORTAL_ENABLED === "true",
  paymentReconciliationV2Enabled:
    process.env.PAYMENT_RECONCILIATION_V2_ENABLED === "true",
  multiTenantWorkspaceV2Enabled:
    process.env.MULTI_TENANT_WORKSPACE_V2_ENABLED === "true",
};

export function isBackupRecoveryEnabled() {
  return (
    y2OrchestrationConfig.backupRecoveryPilotEnabled ||
    y1WedgeConfig.backupShiftRecoveryEnabled
  );
}

export function isMicroConsentActive() {
  return (
    y2OrchestrationConfig.microConsentV2Enabled ||
    y1WedgeConfig.microConsentEnabled
  );
}

/** Transport pickup buffer minutes before care shift start (orchestration v2). */
export const CARE_TRANSPORT_PICKUP_BUFFER_MINUTES = Number(
  process.env.CARE_TRANSPORT_PICKUP_BUFFER_MINUTES ?? "30"
);

/** Reconciliation amount tolerance in cents (default 1 cent). */
export const RECONCILIATION_AMOUNT_TOLERANCE_CENTS = Number(
  process.env.RECONCILIATION_AMOUNT_TOLERANCE_CENTS ?? "1"
);
