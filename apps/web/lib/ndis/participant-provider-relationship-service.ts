import type {
  NdisPaymentRoute,
  ParticipantProviderRelationshipStatus,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { assertOrgAccess } from "@/lib/ndis/claiming/claim-service";
import { paymentRouteRequiresMyProviderCheck } from "@/lib/ndis/claiming/paymentRoute";
import { prisma } from "@/lib/prisma";

export class ParticipantProviderAccessError extends Error {
  constructor(
    message: string,
    public code:
      | "NOT_LINKED"
      | "NOT_ACTIVE"
      | "FORBIDDEN"
      | "NOT_FOUND" = "NOT_LINKED"
  ) {
    super(message);
    this.name = "ParticipantProviderAccessError";
  }
}

export async function assertParticipantLinkedToProvider(
  participantId: string,
  providerOrgId: string,
  options?: { requireActive?: boolean }
) {
  const rel = await prisma.participantProviderRelationship.findUnique({
    where: {
      participantId_providerOrgId: { participantId, providerOrgId },
    },
  });

  if (!rel) {
    throw new ParticipantProviderAccessError(
      "Participant is not linked to this provider organisation.",
      "NOT_LINKED"
    );
  }

  if (options?.requireActive && rel.status !== "active") {
    throw new ParticipantProviderAccessError(
      "My Provider relationship must be active.",
      "NOT_ACTIVE"
    );
  }

  return rel;
}

export async function assertProviderMayServeParticipant(
  participantId: string,
  providerOrgId: string,
  paymentRoute?: NdisPaymentRoute | null
) {
  const requireActive =
    paymentRoute != null && paymentRouteRequiresMyProviderCheck(paymentRoute);
  return assertParticipantLinkedToProvider(participantId, providerOrgId, {
    requireActive,
  });
}

export async function listParticipantProviderRelationships(params: {
  providerOrgId?: string;
  participantId?: string;
  status?: ParticipantProviderRelationshipStatus;
}) {
  return prisma.participantProviderRelationship.findMany({
    where: {
      ...(params.providerOrgId ? { providerOrgId: params.providerOrgId } : {}),
      ...(params.participantId ? { participantId: params.participantId } : {}),
      ...(params.status ? { status: params.status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      providerOrg: { select: { id: true, name: true } },
    },
  });
}

export async function upsertParticipantProviderRelationship(params: {
  participantId: string;
  providerOrgId: string;
  status?: ParticipantProviderRelationshipStatus;
  notes?: string;
  actorUserId: string;
}) {
  const status = params.status ?? "pending_verification";

  const record = await prisma.participantProviderRelationship.upsert({
    where: {
      participantId_providerOrgId: {
        participantId: params.participantId,
        providerOrgId: params.providerOrgId,
      },
    },
    create: {
      participantId: params.participantId,
      providerOrgId: params.providerOrgId,
      status,
      notes: params.notes,
      myProviderVerifiedAt:
        status === "active" ? new Date() : undefined,
    },
    update: {
      status,
      notes: params.notes,
      ...(status === "active"
        ? { myProviderVerifiedAt: new Date() }
        : {}),
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "participant_provider_relationship.upserted",
    entityType: "ParticipantProviderRelationship",
    entityId: record.id,
    participantId: params.participantId,
    organisationId: params.providerOrgId,
    metadata: { status: record.status },
  });

  return record;
}

export async function assertCanManageParticipantProviderRelationship(
  user: CurrentUser,
  participantId: string,
  providerOrgId: string
) {
  if (isAdminRole(user.primaryRole)) return;
  if (user.id === participantId) return;
  await assertOrgAccess(user, providerOrgId);
}
