import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { grantParticipantAuthority } from "@/lib/authority/participant-authority-service";
import {
  identityAuthorityConfig,
  isClinicalDomain,
  isFinancialDomain,
} from "@/lib/config/identity-authority";
import { prisma } from "@/lib/prisma";

const FORBIDDEN_INHERITED_ACTIONS = [
  "execute_payment",
  "submit_claim",
  "diagnose",
  "prescribe",
  "alter_treatment",
  "determine_capacity",
  "determine_safeguarding",
] as const;

function assertSafeProposedAuthority(input: {
  domain: string;
  actions: string[];
}) {
  if (isFinancialDomain(input.domain)) {
    throw new Error("FINANCIAL_AUTHORITY_REQUIRES_EXPLICIT_GRANT");
  }
  if (isClinicalDomain(input.domain)) {
    throw new Error("CLINICAL_AUTHORITY_REQUIRES_EXPLICIT_GRANT");
  }
  for (const action of input.actions) {
    if ((FORBIDDEN_INHERITED_ACTIONS as readonly string[]).includes(action)) {
      throw new Error("DELEGATE_ACTION_NOT_PERMITTED");
    }
  }
}

export async function inviteDelegate(input: {
  participantId: string;
  actorUserId: string;
  inviteeEmail: string;
  roleType:
    | "nominee"
    | "support_coordinator"
    | "plan_manager"
    | "family_member"
    | "other";
  proposedDomain: string;
  proposedActions: string[];
  proposedConsentScopes: string[];
  expiresAt: Date;
  message?: string;
}) {
  if (!identityAuthorityConfig.delegateInvitesEnabled) {
    throw new Error("DELEGATE_INVITES_DISABLED");
  }
  if (input.participantId !== input.actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
  if (input.expiresAt <= new Date()) {
    throw new Error("INVITATION_EXPIRY_REQUIRED");
  }
  assertSafeProposedAuthority({
    domain: input.proposedDomain,
    actions: input.proposedActions,
  });

  const invitee = await prisma.user.findUnique({
    where: { email: input.inviteeEmail.toLowerCase() },
    select: { id: true },
  });

  const invitation = await prisma.delegateInvitation.create({
    data: {
      participantId: input.participantId,
      inviteeEmail: input.inviteeEmail.toLowerCase(),
      inviteeUserId: invitee?.id,
      roleType: input.roleType,
      proposedDomain: input.proposedDomain,
      proposedActions: input.proposedActions,
      proposedConsentScopes: input.proposedConsentScopes,
      message: input.message,
      expiresAt: input.expiresAt,
      status: "pending",
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "delegate.invitation.created",
    entityType: "DelegateInvitation",
    entityId: invitation.id,
    metadata: {
      roleType: input.roleType,
      domain: input.proposedDomain,
    },
  });

  return invitation;
}

export async function respondToDelegateInvitation(input: {
  invitationId: string;
  inviteeUserId: string;
  inviteeEmail: string;
  response: "accepted" | "declined";
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const invitation = await prisma.delegateInvitation.findFirst({
    where: {
      id: input.invitationId,
      status: "pending",
      OR: [
        { inviteeUserId: input.inviteeUserId },
        { inviteeEmail: input.inviteeEmail.toLowerCase() },
      ],
    },
  });
  if (!invitation) throw new Error("DELEGATE_INVITATION_NOT_FOUND");
  if (invitation.expiresAt <= now) {
    await prisma.delegateInvitation.update({
      where: { id: invitation.id },
      data: { status: "expired" },
    });
    throw new Error("DELEGATE_INVITATION_EXPIRED");
  }

  if (input.response === "declined") {
    const declined = await prisma.delegateInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "declined",
        declinedAt: now,
        inviteeUserId: input.inviteeUserId,
      },
    });
    await createAuditEvent({
      actorUserId: input.inviteeUserId,
      participantId: invitation.participantId,
      action: "delegate.invitation.declined",
      entityType: "DelegateInvitation",
      entityId: invitation.id,
    });
    return { invitation: declined, grant: null };
  }

  assertSafeProposedAuthority({
    domain: invitation.proposedDomain,
    actions: invitation.proposedActions,
  });

  const grant = await grantParticipantAuthority({
    participantId: invitation.participantId,
    delegateId: input.inviteeUserId,
    domain: invitation.proposedDomain,
    actions: invitation.proposedActions,
    consentScopes: invitation.proposedConsentScopes,
    expiresAt: invitation.expiresAt,
    actorUserId: invitation.participantId,
    purpose: `delegate_invitation:${invitation.id}`,
    recipientRole: invitation.roleType,
  });

  const accepted = await prisma.delegateInvitation.update({
    where: { id: invitation.id },
    data: {
      status: "accepted",
      acceptedAt: now,
      inviteeUserId: input.inviteeUserId,
      resultingGrantId: grant.id,
    },
  });

  await createAuditEvent({
    actorUserId: input.inviteeUserId,
    participantId: invitation.participantId,
    action: "delegate.invitation.accepted",
    entityType: "DelegateInvitation",
    entityId: invitation.id,
    metadata: { grantId: grant.id },
  });

  return { invitation: accepted, grant };
}

export async function revokeDelegateInvitation(input: {
  invitationId: string;
  participantId: string;
  actorUserId: string;
}) {
  if (input.participantId !== input.actorUserId) {
    throw new Error("PARTICIPANT_AUTHORITY_REQUIRED");
  }
  const result = await prisma.delegateInvitation.updateMany({
    where: {
      id: input.invitationId,
      participantId: input.participantId,
      status: { in: ["pending", "accepted"] },
    },
    data: { status: "revoked", revokedAt: new Date() },
  });
  if (result.count !== 1) throw new Error("DELEGATE_INVITATION_NOT_FOUND");
  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: "delegate.invitation.revoked",
    entityType: "DelegateInvitation",
    entityId: input.invitationId,
  });
}

export async function listDelegateInvitations(participantId: string) {
  return prisma.delegateInvitation.findMany({
    where: { participantId },
    orderBy: { createdAt: "desc" },
  });
}

export async function recordDelegateActionReceipt(input: {
  participantId: string;
  delegateId: string;
  domain: string;
  action: string;
  outcome: string;
  invitationId?: string;
}) {
  return createAuditEvent({
    actorUserId: input.delegateId,
    participantId: input.participantId,
    action: "delegate.action.receipt",
    entityType: "DelegateAction",
    entityId: input.invitationId ?? input.delegateId,
    metadata: {
      domain: input.domain,
      actionName: input.action,
      outcome: input.outcome,
    },
  });
}
