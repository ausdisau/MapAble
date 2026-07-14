/**
 * CareOS Phase 15 — Resilience contracts and procedures.
 * Documents capabilities; marks tested vs documented-only.
 */

export type ResilienceCapabilityStatus = "documented" | "tested" | "untested";

export interface ResilienceCapability {
  id: string;
  name: string;
  description: string;
  status: ResilienceCapabilityStatus;
  rpoMinutes?: number;
  rtoMinutes?: number;
  lastTestedAt?: string;
  notes?: string;
}

export interface RpoRtoTargets {
  rpoMinutes: number;
  rtoMinutes: number;
  documentedOnly: boolean;
}

export interface FailoverProcedure {
  id: string;
  name: string;
  triggerConditions: string[];
  steps: string[];
  rollbackSteps: string[];
  tested: boolean;
  lastDrillId?: string;
}

export interface DegradedModePolicy {
  component: string;
  triggers: string[];
  allowedOperations: string[];
  blockedOperations: string[];
  userMessage: string;
}

export const RESILIENCE_CAPABILITIES: ResilienceCapability[] = [
  {
    id: "pitr",
    name: "Point-in-time recovery (PostgreSQL)",
    description: "Restore database to a specific timestamp using managed PITR.",
    status: "documented",
    rpoMinutes: 15,
    notes: "Requires managed PostgreSQL with PITR enabled — see infra/modules/postgresql",
  },
  {
    id: "backup_verification",
    name: "Backup verification",
    description: "Automated restore-to-staging and checksum validation.",
    status: "untested",
    notes: "Procedure documented; automated verification not yet run in CI",
  },
  {
    id: "object_versioning",
    name: "Object storage versioning",
    description: "S3-compatible versioning for document blobs.",
    status: "documented",
    notes: "Enabled via infra/modules/object-storage",
  },
  {
    id: "event_replay",
    name: "Event outbox replay",
    description: "Replay failed domain events from durable outbox.",
    status: "documented",
    notes: "Uses lib/platform/event-outbox-service",
  },
  {
    id: "queue_recovery",
    name: "Queue dead-letter recovery",
    description: "Inspect and requeue dead-letter messages.",
    status: "documented",
    notes: "Manual procedure — automated replay stub only",
  },
  {
    id: "degraded_mode",
    name: "Degraded mode operation",
    description: "Continue read-only operations when non-critical dependencies fail.",
    status: "tested",
    lastTestedAt: "2026-07-01",
    notes: "Offline/degraded mode tested in mobile-communication phase",
  },
  {
    id: "failover",
    name: "Cross-region failover",
    description: "Promote DR region to primary on declared incident.",
    status: "untested",
    notes: "Procedure documented only — do NOT claim failover works without drill evidence",
  },
  {
    id: "restore_tests",
    name: "Restore drill records",
    description: "Scheduled restore exercises with evidence capture.",
    status: "documented",
    notes: "Tracked in RestoreDrillRecord model",
  },
];

export function getResilienceCapability(id: string): ResilienceCapability | undefined {
  return RESILIENCE_CAPABILITIES.find((c) => c.id === id);
}

export function getDocumentedRpoRto(input: {
  rpoMinutes: number;
  rtoMinutes: number;
}): RpoRtoTargets {
  return {
    rpoMinutes: input.rpoMinutes,
    rtoMinutes: input.rtoMinutes,
    documentedOnly: true,
  };
}

export function listUntestedCapabilities(): ResilienceCapability[] {
  return RESILIENCE_CAPABILITIES.filter((c) => c.status === "untested");
}

export function canClaimFailoverWorks(lastDrillOutcome: "passed" | "failed" | "partial" | "not_run" | null): boolean {
  return lastDrillOutcome === "passed";
}
