import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { ProgrammeId } from "@/lib/programmes/safety-invariants";

export interface ProgrammeAuditInput {
  programmeId: ProgrammeId;
  correlationId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function emitProgrammeAuditEvent(
  input: ProgrammeAuditInput,
): Promise<void> {
  await createAuditEvent({
    actorUserId: input.actorUserId,
    action: `programme.${input.programmeId}.${input.action}`,
    entityType: input.entityType,
    entityId: input.entityId,
    participantId: input.participantId,
    organisationId: input.organisationId,
    metadata: {
      programmeId: input.programmeId,
      correlationId: input.correlationId,
      ...(input.metadata ?? {}),
    },
  });
}

export function createCorrelationId(): string {
  return crypto.randomUUID();
}
