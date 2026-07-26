import type { MapAbleUserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type IndoorAuditAction =
  | "floor_plan.created"
  | "floor_plan.submitted_review"
  | "floor_plan.changes_requested"
  | "floor_plan.approved"
  | "floor_plan.published"
  | "floor_plan.superseded"
  | "floor_plan.archived"
  | "floor_plan.feature_added"
  | "floor_plan.measurement_changed"
  | "correction.proposed"
  | "correction.approved"
  | "correction.rejected"
  | "status.incident_verified"
  | "visit_plan.shared"
  | "visit_plan.revoked"
  | "checkpoint.token_rotated"
  | "accreditation.decision_recorded"
  | "partner.api_key_created"
  | "partner.api_key_revoked";

export async function recordIndoorAuditEvent(params: {
  action: IndoorAuditAction;
  actorUserId?: string | null;
  actorRole?: MapAbleUserRole | null;
  entityType: string;
  entityId?: string;
  placeId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}): Promise<void> {
  const redactedMetadata = params.metadata
    ? redactAuditMetadata(params.metadata)
    : undefined;

  await prisma.auditEvent.create({
    data: {
      actorUserId: params.actorUserId ?? null,
      actorRole: params.actorRole ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      metadata: redactedMetadata
        ? {
            ...redactedMetadata,
            placeId: params.placeId,
          }
        : params.placeId
          ? { placeId: params.placeId }
          : undefined,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

function redactAuditMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const blocked = new Set([
    "accessProfile",
    "preferences",
    "diagnosis",
    "latitude",
    "longitude",
    "structuredData",
    "apiSecret",
    "shareToken",
  ]);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (blocked.has(key)) continue;
    if (typeof value === "string" && value.length > 500) {
      out[key] = `${value.slice(0, 500)}…`;
    } else {
      out[key] = value;
    }
  }
  return out;
}
