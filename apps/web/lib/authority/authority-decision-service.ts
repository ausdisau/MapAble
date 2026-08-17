import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  identityAuthorityConfig,
  isClinicalDomain,
  isFinancialDomain,
} from "@/lib/config/identity-authority";
import { assertNotServiceAccountForParticipantAuthority } from "@/lib/identity/identity-security-service";
import { prisma } from "@/lib/prisma";

import { hasParticipantAuthority } from "./participant-authority-service";

export async function recordAuthorityDecision(input: {
  grantId?: string;
  participantId: string;
  actorUserId: string;
  domain: string;
  action: string;
  decision: "allow" | "deny";
  reason: string;
  purpose?: string;
}) {
  const decision = await prisma.authorityDecision.create({
    data: {
      grantId: input.grantId,
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      domain: input.domain,
      action: input.action,
      decision: input.decision,
      reason: input.reason,
      purpose: input.purpose,
    },
  });
  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: `authority.decision.${input.decision}`,
    entityType: "AuthorityDecision",
    entityId: decision.id,
    metadata: {
      domain: input.domain,
      action: input.action,
      reason: input.reason,
    },
  });
  return decision;
}

export async function evaluateAuthorityDecision(input: {
  participantId: string;
  actorUserId: string;
  domain: string;
  action: string;
  consentScopes?: string[];
  purpose?: string;
  tenantId?: string;
  actorKind?: "user" | "service_account";
  now?: Date;
}) {
  assertNotServiceAccountForParticipantAuthority({
    actorKind: input.actorKind,
  });

  if (
    !identityAuthorityConfig.automaticFinancialAuthorityEnabled &&
    isFinancialDomain(input.domain) &&
    input.participantId !== input.actorUserId
  ) {
    // Financial authority still requires an explicit grant; evaluate below.
  }
  if (
    !identityAuthorityConfig.automaticClinicalAuthorityEnabled &&
    isClinicalDomain(input.domain) &&
    input.participantId !== input.actorUserId
  ) {
    // Clinical authority still requires an explicit grant; evaluate below.
  }

  const allowed = await hasParticipantAuthority({
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    tenantId: input.tenantId,
    domain: input.domain,
    action: input.action,
    consentScopes: input.consentScopes,
    now: input.now,
  });

  let grantId: string | undefined;
  if (allowed && input.participantId !== input.actorUserId) {
    const grant = await prisma.participantAuthorityGrant.findFirst({
      where: {
        participantId: input.participantId,
        delegateId: input.actorUserId,
        domain: input.domain,
        actions: { has: input.action },
        revokedAt: null,
        expiresAt: { gt: input.now ?? new Date() },
        ...(input.tenantId ? { tenantId: input.tenantId } : {}),
      },
      select: { id: true },
    });
    grantId = grant?.id;
  }

  const decision = await recordAuthorityDecision({
    grantId,
    participantId: input.participantId,
    actorUserId: input.actorUserId,
    domain: input.domain,
    action: input.action,
    decision: allowed ? "allow" : "deny",
    reason: allowed
      ? input.participantId === input.actorUserId
        ? "self_authority"
        : "active_grant"
      : "no_active_grant",
    purpose: input.purpose,
  });

  return { allowed, decision };
}

export async function listAuthorityDecisionsForParticipant(
  participantId: string,
  actorUserId: string,
  take = 50,
) {
  if (participantId !== actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
  return prisma.authorityDecision.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function listPeopleWithAccess(participantId: string) {
  const now = new Date();
  return prisma.participantAuthorityGrant.findMany({
    where: {
      participantId,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    include: {
      delegate: { select: { id: true, name: true, email: true } },
    },
    orderBy: { expiresAt: "asc" },
  });
}
