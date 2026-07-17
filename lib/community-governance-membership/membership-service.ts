import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  isCommunityGovernanceMembershipV2Enabled,
  ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER,
} from "@/lib/config/y5-rights-infrastructure";
import { requireRatifiedCharter } from "@/lib/governance-charter/charter-gate-service";
import { prisma } from "@/lib/prisma";

const DEFAULT_TERM_MONTHS = 12;

export async function registerCommunityMember(params: {
  memberLabel: string;
  membershipType?: string;
  region?: string;
}) {
  if (!isCommunityGovernanceMembershipV2Enabled()) {
    throw new Error("MEMBERSHIP_DISABLED");
  }
  await requireRatifiedCharter();

  return prisma.communityGovernanceMembership.create({
    data: {
      memberLabel: params.memberLabel,
      membershipType: params.membershipType ?? "community",
      region: params.region,
      status: "pending",
    },
  });
}

export async function approveCommunityMember(
  membershipId: string,
  actorUserId: string,
  termMonths = DEFAULT_TERM_MONTHS
) {
  const termEndsAt = new Date();
  termEndsAt.setMonth(termEndsAt.getMonth() + termMonths);

  const member = await prisma.communityGovernanceMembership.update({
    where: { id: membershipId },
    data: {
      status: "active",
      approvedBy: actorUserId,
      termEndsAt,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "membership.approved",
    entityType: "CommunityGovernanceMembership",
    entityId: membershipId,
  });

  return member;
}

export async function revokeCommunityMember(
  membershipId: string,
  actorUserId: string
) {
  const member = await prisma.communityGovernanceMembership.update({
    where: { id: membershipId },
    data: { status: "revoked" },
  });
  await createAuditEvent({
    actorUserId,
    action: "membership.revoked",
    entityType: "CommunityGovernanceMembership",
    entityId: membershipId,
  });
  return member;
}

export async function renewCommunityMember(
  membershipId: string,
  actorUserId: string,
  termMonths = DEFAULT_TERM_MONTHS
) {
  const termEndsAt = new Date();
  termEndsAt.setMonth(termEndsAt.getMonth() + termMonths);

  return prisma.communityGovernanceMembership.update({
    where: { id: membershipId },
    data: {
      status: "active",
      termEndsAt,
      approvedBy: actorUserId,
    },
  });
}

export async function listPublicMembershipDirectory() {
  if (!isCommunityGovernanceMembershipV2Enabled()) return [];
  return prisma.communityGovernanceMembership.findMany({
    where: { status: "active" },
    orderBy: { joinedAt: "desc" },
    take: 100,
    select: {
      id: true,
      memberLabel: true,
      membershipType: true,
      region: true,
      termEndsAt: true,
      disclaimer: true,
      joinedAt: true,
    },
  });
}

export async function listAllMemberships() {
  return prisma.communityGovernanceMembership.findMany({
    orderBy: { joinedAt: "desc" },
    take: 50,
  });
}

export function getMembershipDisclaimer() {
  return ACCOUNTABILITY_TRANSPARENCY_DISCLAIMER;
}
