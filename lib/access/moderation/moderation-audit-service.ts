import { createAuditEvent } from "@/lib/audit/audit-event-service";

export async function logModerationAction(params: {
  moderatorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}) {
  await createAuditEvent({
    actorUserId: params.moderatorId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    metadata: params.metadata,
  });
}
