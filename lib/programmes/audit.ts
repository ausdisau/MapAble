import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { ProgrammeId } from "@/lib/programmes/safety-invariants";

const SENSITIVE_METADATA_KEYS = [
  "diagnosis",
  "clinicalNotes",
  "freeText",
  "body",
  "content",
  "payload",
  "raw",
  "documentText",
  "homeAddress",
];

export interface ProgrammeAuditInput {
  programmeId: ProgrammeId;
  correlationId: string;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
  /** Must not include sensitive programme payloads. */
  metadata?: Record<string, unknown> | null;
}

export function sanitiseProgrammeAuditMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!metadata) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_METADATA_KEYS.includes(key)) continue;
    if (typeof value === "string" && value.length > 500) continue;
    out[key] = value;
  }
  return out;
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
      ...sanitiseProgrammeAuditMetadata(input.metadata),
    },
  });
}

export function createCorrelationId(): string {
  return crypto.randomUUID();
}
