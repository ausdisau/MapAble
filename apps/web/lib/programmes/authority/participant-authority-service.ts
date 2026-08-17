import { prisma } from "@/lib/prisma";
import { emitProgrammeAuditEvent } from "@/lib/programmes/audit";
import { assertDisclosureScope } from "@/lib/programmes/safety-invariants";

export interface CreateAuthorityGrantInput {
  participantId: string;
  granteeUserId?: string;
  granteeOrganisationId?: string;
  purpose: string;
  allowedFields: string[];
  allowedActions?: string[];
  consentRecordId?: string;
  expiresAt?: Date;
  createdById: string;
  correlationId: string;
}

export async function createParticipantAuthorityGrant(
  input: CreateAuthorityGrantInput,
) {
  assertDisclosureScope({
    recipientId: input.granteeUserId ?? input.granteeOrganisationId,
    purpose: input.purpose,
    fields: input.allowedFields,
    expiry: input.expiresAt ?? null,
  });

  const grant = await prisma.participantAuthorityGrant.create({
    data: {
      participantId: input.participantId,
      granteeUserId: input.granteeUserId,
      granteeOrganisationId: input.granteeOrganisationId,
      purpose: input.purpose,
      allowedFields: input.allowedFields,
      allowedActions: input.allowedActions ?? [],
      consentRecordId: input.consentRecordId,
      expiresAt: input.expiresAt,
      createdById: input.createdById,
      correlationId: input.correlationId,
      status: "active",
    },
  });

  await emitProgrammeAuditEvent({
    programmeId: "pathways",
    correlationId: input.correlationId,
    actorUserId: input.createdById,
    action: "authority.granted",
    entityType: "ParticipantAuthorityGrant",
    entityId: grant.id,
    participantId: input.participantId,
    metadata: {
      purpose: input.purpose,
      allowedFields: input.allowedFields,
    },
  });

  return grant;
}

export async function revokeParticipantAuthorityGrant(input: {
  grantId: string;
  participantId: string;
  revokedById: string;
  correlationId: string;
}) {
  const existing = await prisma.participantAuthorityGrant.findFirst({
    where: {
      id: input.grantId,
      participantId: input.participantId,
      status: "active",
    },
  });

  if (!existing) {
    throw new Error("Authority grant not found or not active");
  }

  const grant = await prisma.participantAuthorityGrant.update({
    where: { id: input.grantId },
    data: {
      status: "revoked",
      revokedById: input.revokedById,
      revokedAt: new Date(),
    },
  });

  await emitProgrammeAuditEvent({
    programmeId: "pathways",
    correlationId: input.correlationId,
    actorUserId: input.revokedById,
    action: "authority.revoked",
    entityType: "ParticipantAuthorityGrant",
    entityId: grant.id,
    participantId: input.participantId,
  });

  return grant;
}

export async function evaluateParticipantAuthority(input: {
  participantId: string;
  actorUserId: string;
  purpose: string;
  requestedFields: string[];
  requestedAction?: string;
}) {
  if (input.actorUserId === input.participantId) {
    return {
      allowed: true,
      allowedFields: input.requestedFields,
      reason: "Participant is primary decision-maker",
    };
  }

  const now = new Date();
  const grants = await prisma.participantAuthorityGrant.findMany({
    where: {
      participantId: input.participantId,
      granteeUserId: input.actorUserId,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });

  for (const grant of grants) {
    if (grant.purpose !== input.purpose) {
      continue;
    }

    const allowedFields = input.requestedFields.filter((field) =>
      grant.allowedFields.includes(field),
    );

    if (input.requestedAction) {
      if (!grant.allowedActions.includes(input.requestedAction)) {
        continue;
      }
    }

    if (allowedFields.length === input.requestedFields.length) {
      return {
        allowed: true,
        allowedFields,
        grantId: grant.id,
      };
    }
  }

  return {
    allowed: false,
    allowedFields: [],
    reason: "No matching authority grant for requested scope",
  };
}

export const participantAuthorityPolicy = {
  evaluateAuthority: evaluateParticipantAuthority,
};
