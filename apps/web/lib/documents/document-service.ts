import type { DocumentVisibility } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/mapable";

export async function canAccessDocument(
  userId: string,
  role: UserRole,
  doc: {
    uploadedById: string;
    participantId: string | null;
    organisationId: string | null;
    visibility: DocumentVisibility;
  }
): Promise<boolean> {
  if (isAdminRole(role)) return true;
  if (doc.uploadedById === userId) return true;
  if (doc.participantId === userId) return true;

  if (doc.visibility === "organisation_private" && doc.organisationId) {
    const member = await prisma.organisationMember.findFirst({
      where: { userId, organisationId: doc.organisationId },
    });
    return Boolean(member);
  }

  if (
    doc.visibility === "shared_with_provider" &&
    doc.organisationId &&
    (role === "provider_admin" || role === "transport_operator")
  ) {
    const member = await prisma.organisationMember.findFirst({
      where: { userId, organisationId: doc.organisationId },
    });
    return Boolean(member);
  }

  return false;
}

export async function logAdminDocumentAccess(params: {
  actorUserId: string;
  actorRole: UserRole;
  documentId: string;
  participantId?: string;
}) {
  await createAuditEvent({
    actorUserId: params.actorUserId,
    actorRole: params.actorRole as never,
    action: "admin.accessed_sensitive_record",
    entityType: "Document",
    entityId: params.documentId,
    participantId: params.participantId,
  });
}
