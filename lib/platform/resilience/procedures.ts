import type { DegradedModePolicy, FailoverProcedure } from "@/lib/platform/resilience/contracts";
import {
  assertNoUntestedFailoverClaims,
  nationalPlatformConfig,
} from "@/lib/config/national-platform";

export const DEGRADED_MODE_POLICIES: DegradedModePolicy[] = [
  {
    component: "database",
    triggers: ["connection_timeout", "replica_lag_high"],
    allowedOperations: ["read_cached", "offline_queue"],
    blockedOperations: ["write", "payment", "claim_submission"],
    userMessage: "Some features are temporarily unavailable. Your changes are saved locally.",
  },
  {
    component: "queue",
    triggers: ["broker_unreachable", "dlq_threshold_exceeded"],
    allowedOperations: ["sync_api", "read"],
    blockedOperations: ["webhook_delivery", "async_workflow"],
    userMessage: "Background processing is delayed. Core features remain available.",
  },
  {
    component: "object_storage",
    triggers: ["bucket_unreachable"],
    allowedOperations: ["read_metadata", "list_documents"],
    blockedOperations: ["upload", "download"],
    userMessage: "Document upload and download are temporarily unavailable.",
  },
];

export const FAILOVER_PROCEDURES: FailoverProcedure[] = [
  {
    id: "db_promote_replica",
    name: "Promote read replica to primary",
    triggerConditions: [
      "Primary region declared unavailable",
      "RTO clock started",
      "Incident commander assigned",
    ],
    steps: [
      "Verify DR replica lag < documented RPO",
      "Stop writes to primary (if reachable)",
      "Promote DR replica via managed provider API",
      "Update DATABASE_URL in secrets manager",
      "Run prisma migrate deploy against promoted instance",
      "Verify health checks pass in DR region",
    ],
    rollbackSteps: [
      "If primary recovered, do NOT split-brain — follow runbook section 4.2",
      "Restore from latest verified backup if promotion fails",
    ],
    tested: false,
  },
  {
    id: "dns_failover",
    name: "DNS failover to DR region",
    triggerConditions: ["Application tier unreachable in primary region"],
    steps: [
      "Lower TTL pre-incident (see infra/modules/dns)",
      "Update weighted routing to DR ALB",
      "Verify CDN origin points to DR",
      "Monitor error rates for 15 minutes",
    ],
    rollbackSteps: ["Restore primary weights when primary region healthy"],
    tested: false,
  },
];

export function getFailoverProcedure(id: string): FailoverProcedure | undefined {
  return FAILOVER_PROCEDURES.find((p) => p.id === id);
}

export function assertFailoverClaimAllowed(lastDrillPassed: boolean) {
  assertNoUntestedFailoverClaims();
  if (!lastDrillPassed) {
    throw new Error("FAILOVER_NOT_TESTED");
  }
}

export function getDocumentedTargets() {
  return {
    rpoMinutes: nationalPlatformConfig.documentedRpoMinutes,
    rtoMinutes: nationalPlatformConfig.documentedRtoMinutes,
    primaryRegion: nationalPlatformConfig.primaryRegion,
    drRegion: nationalPlatformConfig.drRegion,
  };
}
