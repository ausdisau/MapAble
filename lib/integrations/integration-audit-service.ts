import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { logIntegrationEvent } from "@/lib/integrations/integration-event-service";

export async function auditIntegrationAction(input: {
  integrationKey: string;
  action: string;
  actorUserId?: string | null;
  metadata?: Record<string, unknown>;
  severity?: "info" | "warning" | "error";
}): Promise<void> {
  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: `integration:${input.action}`,
    entityType: "integration",
    entityId: input.integrationKey,
    metadata: {
      integrationKey: input.integrationKey,
      ...input.metadata,
    },
  });

  await logIntegrationEvent({
    integrationKey: input.integrationKey,
    eventType: input.action,
    severity: input.severity ?? "info",
    message: input.action,
    metadata: input.metadata,
    actorUserId: input.actorUserId,
  });
}
