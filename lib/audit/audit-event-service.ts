import type { MapAbleUserRole, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { AuditAction } from "@/types/mapable";

export interface CreateAuditEventInput {
  actorUserId?: string | null;
  actorRole?: MapAbleUserRole | null;
  action: AuditAction | string;
  entityType: string;
  entityId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
  metadata?: Record<string, unknown> | null;
  /** Optional transaction client for atomic writes with domain creates. */
  tx?: Prisma.TransactionClient;
}

async function requestMeta(): Promise<{
  ipAddress?: string;
  userAgent?: string;
}> {
  // Dynamic import keeps this module out of Client Component graphs that
  // accidentally transitively reference createAuditEvent.
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    return {
      ipAddress:
        h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        h.get("x-real-ip") ??
        undefined,
      userAgent: h.get("user-agent") ?? undefined,
    };
  } catch {
    return {};
  }
}

export async function createAuditEvent(
  input: CreateAuditEventInput,
): Promise<void> {
  const meta = await requestMeta();
  const safeMetadata = input.metadata
    ? JSON.parse(
        JSON.stringify(input.metadata, (_key, value) => {
          if (
            typeof value === "string" &&
            /ndis|password|secret/i.test(_key as string)
          ) {
            return "[REDACTED]";
          }
          return value;
        }),
      )
    : undefined;

  const db = input.tx ?? prisma;
  await db.auditEvent.create({
    data: {
      actorUserId: input.actorUserId ?? null,
      actorRole: input.actorRole ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      participantId: input.participantId ?? null,
      organisationId: input.organisationId ?? null,
      metadata: safeMetadata,
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent,
    },
  });
}

export async function logAdminSensitiveAccess(params: {
  actorUserId: string;
  actorRole: MapAbleUserRole;
  entityType: string;
  entityId: string;
  participantId?: string;
}): Promise<void> {
  await createAuditEvent({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: "admin.accessed_sensitive_record",
    entityType: params.entityType,
    entityId: params.entityId,
    participantId: params.participantId,
  });
}
