import { randomUUID } from "crypto";

import type { MapAbleUserRole } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { writeBillingAuditLog } from "@/lib/billing-core/audit";
import type { FinancialAuditEvent } from "@/types/billing";

export type WriteFinancialAuditInput = {
  organisationId?: string | null;
  actorId?: string | null;
  actorRole?: MapAbleUserRole | string | null;
  action: string;
  entityType: string;
  entityId: string;
  previousValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  reason?: string;
  policyVersionId?: string;
  correlationId?: string;
  participantId?: string | null;
};

/**
 * Dual-writes BillingAuditLog + platform AuditEvent for material financial actions.
 */
export async function writeFinancialAudit(
  input: WriteFinancialAuditInput
): Promise<FinancialAuditEvent> {
  const correlationId = input.correlationId ?? randomUUID();
  const occurredAt = new Date().toISOString();

  await writeBillingAuditLog({
    actorUserId: input.actorId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    before: input.previousValues,
    after: {
      ...input.newValues,
      reason: input.reason,
      policyVersionId: input.policyVersionId,
      correlationId,
      organisationId: input.organisationId,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorId ?? undefined,
    actorRole: (input.actorRole as MapAbleUserRole | null | undefined) ?? undefined,
    action: `billing.${input.action}`,
    entityType: input.entityType,
    entityId: input.entityId,
    organisationId: input.organisationId ?? undefined,
    participantId: input.participantId ?? undefined,
    metadata: {
      correlationId,
      reason: input.reason,
      policyVersionId: input.policyVersionId,
      previousValues: input.previousValues,
      newValues: input.newValues,
    },
  });

  return {
    id: correlationId,
    organisationId: input.organisationId ?? null,
    actorId: input.actorId ?? null,
    actorRole: input.actorRole ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    previousValues: input.previousValues,
    newValues: input.newValues,
    reason: input.reason,
    policyVersionId: input.policyVersionId,
    occurredAt,
    correlationId,
  };
}
