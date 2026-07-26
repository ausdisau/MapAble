import { randomBytes } from "crypto";

import type { WorkerOrganisationInviteStatus } from "@prisma/client";

import { OrganisationAccessError , assertOrganisationAccess } from "@/lib/api/organisation-scope";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { normalizeAuthEmail } from "@/lib/auth/auth-flow";
import type { CurrentUser } from "@/lib/auth/current-user";
import { refreshWorkerOnboarding } from "@/lib/onboarding/onboarding-service";
import { prisma } from "@/lib/prisma";
import { syncWorkersOnboardingTask } from "@/lib/provider-onboarding-automation/onboarding-service";

import { associateWorkerWithOrganisation } from "./worker-profile-service";

const INVITE_TTL_DAYS = 14;

function generateInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

function inviteExpiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_TTL_DAYS);
  return d;
}

export function buildWorkerInviteUrl(token: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}/invite/worker/${token}`;
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

export async function inviteWorkerToOrganisation(params: {
  organisationId: string;
  email: string;
  displayName?: string;
  invitedBy: CurrentUser;
}) {
  await assertOrganisationAccess(params.invitedBy, params.organisationId);

  const email = normalizeAuthEmail(params.email);
  if (!email.includes("@")) throw new Error("INVALID_EMAIL");

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const existingProfile = await prisma.workerProfile.findUnique({
      where: {
        userId_organisationId: {
          userId: existingUser.id,
          organisationId: params.organisationId,
        },
      },
    });
    if (existingProfile?.active) {
      throw new Error("WORKER_ALREADY_ASSOCIATED");
    }
  }

  const pendingInvite = await prisma.workerOrganisationInvite.findFirst({
    where: {
      organisationId: params.organisationId,
      email,
      status: "pending",
      expiresAt: { gt: new Date() },
    },
  });
  if (pendingInvite) {
    throw new Error("INVITE_ALREADY_PENDING");
  }

  const placeholderName =
    params.displayName?.trim() ||
    email.split("@")[0] ||
    "New worker";

  const profile = await prisma.workerProfile.create({
    data: {
      organisationId: params.organisationId,
      displayName: placeholderName,
      verificationStatus: "pending_review",
      active: false,
      invitedAt: new Date(),
    },
  });

  const token = generateInviteToken();
  const invite = await prisma.workerOrganisationInvite.create({
    data: {
      organisationId: params.organisationId,
      email,
      invitedByUserId: params.invitedBy.id,
      token,
      displayName: params.displayName?.trim() || null,
      workerProfileId: profile.id,
      expiresAt: inviteExpiresAt(),
      status: "pending",
    },
    include: {
      organisation: { select: { id: true, name: true } },
    },
  });

  await createAuditEvent({
    actorUserId: params.invitedBy.id,
    action: "worker_invite.created",
    entityType: "WorkerOrganisationInvite",
    entityId: invite.id,
    organisationId: params.organisationId,
    metadata: { email, workerProfileId: profile.id },
  });

  return {
    invite,
    inviteUrl: buildWorkerInviteUrl(token),
  };
}

export async function listOrganisationWorkers(organisationId: string) {
  return prisma.workerProfile.findMany({
    where: { organisationId },
    orderBy: [{ active: "desc" }, { displayName: "asc" }],
    select: {
      id: true,
      userId: true,
      displayName: true,
      profileSummary: true,
      verificationStatus: true,
      workerScreeningStatus: true,
      wwccStatus: true,
      active: true,
      joinedAt: true,
      invitedAt: true,
      createdAt: true,
    },
  });
}

export async function listPendingOrganisationInvites(organisationId: string) {
  return prisma.workerOrganisationInvite.findMany({
    where: {
      organisationId,
      status: "pending",
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      status: true,
      expiresAt: true,
      createdAt: true,
      workerProfileId: true,
    },
  });
}

export async function revokeWorkerInvite(params: {
  organisationId: string;
  inviteId: string;
  actor: CurrentUser;
}) {
  await assertOrganisationAccess(params.actor, params.organisationId);

  const invite = await prisma.workerOrganisationInvite.findFirst({
    where: {
      id: params.inviteId,
      organisationId: params.organisationId,
      status: "pending",
    },
  });
  if (!invite) throw new Error("INVITE_NOT_FOUND");

  await prisma.$transaction(async (tx) => {
    await tx.workerOrganisationInvite.update({
      where: { id: invite.id },
      data: { status: "revoked" },
    });
    if (invite.workerProfileId) {
      await tx.workerProfile.updateMany({
        where: {
          id: invite.workerProfileId,
          userId: null,
        },
        data: { active: false },
      });
    }
  });

  await createAuditEvent({
    actorUserId: params.actor.id,
    action: "worker_invite.revoked",
    entityType: "WorkerOrganisationInvite",
    entityId: invite.id,
    organisationId: params.organisationId,
  });

  return { ok: true };
}

export async function getWorkerInviteByToken(token: string) {
  const invite = await prisma.workerOrganisationInvite.findUnique({
    where: { token },
    include: {
      organisation: { select: { id: true, name: true } },
    },
  });
  if (!invite) return null;

  if (invite.status === "pending" && invite.expiresAt < new Date()) {
    await prisma.workerOrganisationInvite.update({
      where: { id: invite.id },
      data: { status: "expired" },
    });
    return { ...invite, status: "expired" as WorkerOrganisationInviteStatus };
  }

  return invite;
}

async function ensureSupportWorkerRole(userId: string) {
  await prisma.userRoleAssignment.upsert({
    where: { userId_role: { userId, role: "support_worker" } },
    create: { userId, role: "support_worker", isPrimary: false },
    update: {},
  });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.primaryRole === "participant") {
    await prisma.user.update({
      where: { id: userId },
      data: { primaryRole: "support_worker" },
    });
    await prisma.userRoleAssignment.updateMany({
      where: { userId, isPrimary: true },
      data: { isPrimary: false },
    });
    await prisma.userRoleAssignment.update({
      where: { userId_role: { userId, role: "support_worker" } },
      data: { isPrimary: true },
    });
  }
}

export async function acceptWorkerInvite(params: {
  token: string;
  userId: string;
  userEmail: string;
}) {
  const invite = await getWorkerInviteByToken(params.token);
  if (!invite) throw new Error("INVITE_NOT_FOUND");
  if (invite.status !== "pending") throw new Error("INVITE_NOT_AVAILABLE");

  const normalizedEmail = normalizeAuthEmail(params.userEmail);
  if (normalizedEmail !== invite.email) {
    throw new Error("EMAIL_MISMATCH");
  }

  const existingLinked = await prisma.workerProfile.findUnique({
    where: {
      userId_organisationId: {
        userId: params.userId,
        organisationId: invite.organisationId,
      },
    },
  });
  if (existingLinked?.active) {
    throw new Error("WORKER_ALREADY_ASSOCIATED");
  }

  await ensureSupportWorkerRole(params.userId);

  let profileId = invite.workerProfileId;
  if (profileId) {
    await associateWorkerWithOrganisation({
      workerProfileId: profileId,
      userId: params.userId,
      displayName: invite.displayName ?? undefined,
      actorUserId: params.userId,
      activate: true,
    });
  } else {
    const profile = await associateWorkerWithOrganisation({
      organisationId: invite.organisationId,
      userId: params.userId,
      displayName: invite.displayName ?? params.userEmail.split("@")[0],
      createdById: params.userId,
      activate: true,
    });
    profileId = profile.id;
  }

  await prisma.workerOrganisationInvite.update({
    where: { id: invite.id },
    data: {
      status: "accepted",
      acceptedAt: new Date(),
      workerProfileId: profileId,
    },
  });

  await refreshWorkerOnboarding(profileId, params.userId);
  await syncWorkersOnboardingTask(invite.organisationId);

  await createAuditEvent({
    actorUserId: params.userId,
    action: "worker_invite.accepted",
    entityType: "WorkerOrganisationInvite",
    entityId: invite.id,
    organisationId: invite.organisationId,
    metadata: { workerProfileId: profileId },
  });

  const profile = await prisma.workerProfile.findUnique({
    where: { id: profileId! },
  });

  return { profile, organisation: invite.organisation };
}

export async function deactivateWorkerProfile(params: {
  organisationId: string;
  workerProfileId: string;
  active: boolean;
  actor: CurrentUser;
}) {
  await assertOrganisationAccess(params.actor, params.organisationId);

  const profile = await prisma.workerProfile.findFirst({
    where: {
      id: params.workerProfileId,
      organisationId: params.organisationId,
    },
  });
  if (!profile) throw new OrganisationAccessError("NOT_FOUND");

  const updated = await prisma.workerProfile.update({
    where: { id: profile.id },
    data: { active: params.active },
  });

  await createAuditEvent({
    actorUserId: params.actor.id,
    action: params.active
      ? "worker_profile.reactivated"
      : "worker_profile.deactivated",
    entityType: "WorkerProfile",
    entityId: profile.id,
    organisationId: params.organisationId,
  });

  return updated;
}
