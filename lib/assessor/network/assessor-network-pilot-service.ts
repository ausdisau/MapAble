import { getAssessorNetworkDirectory, registerAssessorNetworkMember } from "@/lib/assessor/network/network-service";
import { closeAssessorCase, createAssessorCase } from "@/lib/assessor/tools/assessor-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { y3NationalTrustConfig } from "@/lib/config/y3-national-trust";
import { hasMicroConsent } from "@/lib/consent/micro-consent-service";
import { prisma } from "@/lib/prisma";


export function isAssessorNetworkPilotEnabled() {
  return y3NationalTrustConfig.assessorNetworkPilotEnabled;
}

export async function registerAssessorForPilot(params: {
  userId: string;
  credential: string;
  region: string;
  capacity?: number;
}) {
  if (!isAssessorNetworkPilotEnabled()) {
    throw new Error("ASSESSOR_NETWORK_PILOT_DISABLED");
  }

  return registerAssessorNetworkMember({
    userId: params.userId,
    credential: params.credential,
    regions: [params.region],
  }).then((member) =>
    prisma.assessorNetworkMember.update({
      where: { id: member.id },
      data: {
        region: params.region,
        capacity: params.capacity ?? 10,
        status: "pending",
      },
    })
  );
}

export async function verifyAssessorCredential(params: {
  memberId: string;
  actorUserId: string;
  approved: boolean;
}) {
  if (!isAssessorNetworkPilotEnabled()) {
    throw new Error("ASSESSOR_NETWORK_PILOT_DISABLED");
  }

  const member = await prisma.assessorNetworkMember.update({
    where: { id: params.memberId },
    data: {
      status: params.approved ? "active" : "rejected",
      credentialVerifiedAt: params.approved ? new Date() : null,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: params.approved
      ? "assessor_network.credential_verified"
      : "assessor_network.credential_rejected",
    entityType: "AssessorNetworkMember",
    entityId: member.id,
  });

  return member;
}

export async function openAssessorCaseWithConsent(params: {
  assessorUserId: string;
  caseType: string;
  participantId?: string;
  referenceCode?: string;
  notes?: string;
}) {
  if (!isAssessorNetworkPilotEnabled()) {
    throw new Error("ASSESSOR_NETWORK_PILOT_DISABLED");
  }

  if (params.participantId) {
    const allowed = await hasMicroConsent({
      action: "coordinator.participant_access",
      subjectUserId: params.participantId,
      grantedToUserId: params.assessorUserId,
    });
    if (!allowed) {
      throw new Error("CONSENT_REQUIRED");
    }
  }

  return createAssessorCase({
    assessorUserId: params.assessorUserId,
    caseType: params.caseType,
    referenceCode: params.referenceCode,
    notes: params.notes,
  });
}

export async function closeAssessorCasePilot(caseId: string, actorUserId: string) {
  const closed = await closeAssessorCase(caseId);
  await createAuditEvent({
    actorUserId,
    action: "assessor_network.case_closed",
    entityType: "AssessorCase",
    entityId: caseId,
  });
  return closed;
}

export async function listAssessorVerificationQueue() {
  if (!isAssessorNetworkPilotEnabled()) return [];
  return prisma.assessorNetworkMember.findMany({
    where: { status: "pending" },
    orderBy: { joinedAt: "asc" },
    take: 50,
  });
}

export async function getAssessorPilotProfile(userId: string) {
  const member = await prisma.assessorNetworkMember.findUnique({
    where: { userId },
  });
  const directory = isAssessorNetworkPilotEnabled()
    ? await getAssessorNetworkDirectory()
    : [];
  return { member, activeAssessors: directory.length };
}
