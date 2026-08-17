import type { OnboardingRole } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

import {
  evaluateParticipantOnboarding,
  evaluateProviderOnboarding,
  evaluateWorkerOnboarding,
  type OnboardingEvaluation,
} from "./onboarding-evaluator";

async function upsertOnboardingProfile(params: {
  role: OnboardingRole;
  userId?: string;
  organisationId?: string;
  workerProfileId?: string;
  evaluation: OnboardingEvaluation;
  actorUserId: string;
}) {
  const existing = await prisma.onboardingProfile.findFirst({
    where: {
      role: params.role,
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.organisationId
        ? { organisationId: params.organisationId }
        : {}),
      ...(params.workerProfileId
        ? { workerProfileId: params.workerProfileId }
        : {}),
    },
  });

  const data = {
    role: params.role,
    userId: params.userId,
    organisationId: params.organisationId,
    workerProfileId: params.workerProfileId,
    profileCompletenessScore: params.evaluation.profileCompletenessScore,
    readyToMatch: params.evaluation.readyToMatch,
    checklistJson: params.evaluation.checklist,
    lastEvaluatedAt: new Date(),
  };

  const profile = existing
    ? await prisma.onboardingProfile.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.onboardingProfile.create({ data });

  if (
    existing &&
    existing.readyToMatch !== params.evaluation.readyToMatch
  ) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "onboarding.ready_to_match_changed",
      entityType: "OnboardingProfile",
      entityId: profile.id,
      participantId:
        params.role === "participant" ? params.userId : undefined,
      organisationId: params.organisationId,
      metadata: {
        readyToMatch: params.evaluation.readyToMatch,
        role: params.role,
      },
    });
  }

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "onboarding.checklist_updated",
    entityType: "OnboardingProfile",
    entityId: profile.id,
    participantId: params.role === "participant" ? params.userId : undefined,
    organisationId: params.organisationId,
    metadata: {
      score: params.evaluation.profileCompletenessScore,
      role: params.role,
    },
  });

  return profile;
}

export async function refreshParticipantOnboarding(
  userId: string,
  actorUserId: string
) {
  const evaluation = await evaluateParticipantOnboarding(userId);
  return upsertOnboardingProfile({
    role: "participant",
    userId,
    evaluation,
    actorUserId,
  });
}

export async function refreshWorkerOnboarding(
  workerProfileId: string,
  actorUserId: string
) {
  const worker = await prisma.workerProfile.findUnique({
    where: { id: workerProfileId },
    select: { userId: true, organisationId: true },
  });
  const evaluation = await evaluateWorkerOnboarding(workerProfileId);
  return upsertOnboardingProfile({
    role: "worker",
    userId: worker?.userId ?? undefined,
    organisationId: worker?.organisationId,
    workerProfileId,
    evaluation,
    actorUserId,
  });
}

export async function refreshProviderOnboarding(
  organisationId: string,
  actorUserId: string
) {
  const evaluation = await evaluateProviderOnboarding(organisationId);
  return upsertOnboardingProfile({
    role: "provider",
    organisationId,
    evaluation,
    actorUserId,
  });
}

export async function getOnboardingForUser(userId: string, role: string) {
  if (role === "participant") {
    const profile = await prisma.onboardingProfile.findUnique({
      where: { userId_role: { userId, role: "participant" } },
    });
    if (profile) return profile;
    return refreshParticipantOnboarding(userId, userId);
  }

  if (role === "support_worker") {
    const worker = await prisma.workerProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });
    if (!worker) return null;
    const profile = await prisma.onboardingProfile.findFirst({
      where: { workerProfileId: worker.id },
    });
    if (profile) return profile;
    return refreshWorkerOnboarding(worker.id, userId);
  }

  if (
    role === "provider_admin" ||
    role === "provider_staff" ||
    role === "provider"
  ) {
    const membership = await prisma.organisationMember.findFirst({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    if (!membership) return null;
    const profile = await prisma.onboardingProfile.findUnique({
      where: {
        organisationId_role: {
          organisationId: membership.organisationId,
          role: "provider",
        },
      },
    });
    if (profile) return profile;
    return refreshProviderOnboarding(membership.organisationId, userId);
  }

  return null;
}

export async function assertReadyToMatchForParticipant(participantId: string) {
  const profile = await prisma.onboardingProfile.findUnique({
    where: { userId_role: { userId: participantId, role: "participant" } },
  });
  if (!profile?.readyToMatch) {
    throw new Error("ONBOARDING_NOT_READY");
  }
}

export async function assertReadyToMatchForWorker(workerProfileId: string) {
  const profile = await prisma.onboardingProfile.findFirst({
    where: { workerProfileId, role: "worker" },
  });
  if (!profile?.readyToMatch) {
    throw new Error("ONBOARDING_NOT_READY");
  }
}
