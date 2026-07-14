import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function grantParticipantAuthority(input: {
  participantId: string;
  delegateId: string;
  tenantId?: string;
  domain: string;
  actions: string[];
  consentScopes: string[];
  expiresAt: Date;
  actorUserId: string;
}) {
  if (input.participantId !== input.actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
  if (input.expiresAt <= new Date()) throw new Error("AUTHORITY_EXPIRY_REQUIRED");
  const grant = await prisma.participantAuthorityGrant.create({
    data: {
      participantId: input.participantId,
      delegateId: input.delegateId,
      tenantId: input.tenantId,
      domain: input.domain,
      actions: input.actions,
      consentScopes: input.consentScopes,
      expiresAt: input.expiresAt,
    },
  });
  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "participant_authority.granted",
    entityType: "ParticipantAuthorityGrant",
    entityId: grant.id,
    metadata: {
      delegateId: input.delegateId,
      domain: input.domain,
      actions: input.actions,
      expiresAt: input.expiresAt.toISOString(),
    },
  });
  return grant;
}

export async function revokeParticipantAuthority(input: {
  grantId: string;
  participantId: string;
  actorUserId: string;
}) {
  if (input.participantId !== input.actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
  const result = await prisma.participantAuthorityGrant.updateMany({
    where: { id: input.grantId, participantId: input.participantId, revokedAt: null },
    data: { revokedAt: new Date(), revokedById: input.actorUserId },
  });
  if (result.count !== 1) throw new Error("AUTHORITY_GRANT_NOT_FOUND");
  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "participant_authority.revoked",
    entityType: "ParticipantAuthorityGrant",
    entityId: input.grantId,
  });
}

export async function hasParticipantAuthority(input: {
  participantId: string;
  actorUserId: string;
  tenantId?: string;
  domain: string;
  action: string;
  consentScopes?: string[];
  now?: Date;
}) {
  if (input.participantId === input.actorUserId) return true;
  const now = input.now ?? new Date();
  const grant = await prisma.participantAuthorityGrant.findFirst({
    where: {
      participantId: input.participantId,
      delegateId: input.actorUserId,
      domain: input.domain,
      actions: { has: input.action },
      revokedAt: null,
      expiresAt: { gt: now },
      ...(input.tenantId ? { tenantId: input.tenantId } : {}),
    },
  });
  if (!grant) return false;
  return (input.consentScopes ?? []).every((scope) =>
    grant.consentScopes.includes(scope),
  );
}
