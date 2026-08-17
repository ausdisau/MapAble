import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { y3NationalTrustConfig } from "@/lib/config/y3-national-trust";
import { hasMicroConsent } from "@/lib/consent/micro-consent-service";
import { prisma } from "@/lib/prisma";

export function isParticipationPlannerEnabled() {
  return y3NationalTrustConfig.participationPlannerEnabled;
}

export async function createParticipationGoal(params: {
  participantId: string;
  title: string;
  targetDate?: Date;
  notes?: string;
  organisationId?: string;
}) {
  if (!isParticipationPlannerEnabled()) {
    throw new Error("PARTICIPATION_PLANNER_DISABLED");
  }

  return prisma.participationGoal.create({
    data: {
      participantId: params.participantId,
      title: params.title,
      targetDate: params.targetDate,
      notes: params.notes,
      organisationId: params.organisationId,
      status: "active",
    },
  });
}

export async function listParticipationGoalsForParticipant(participantId: string) {
  if (!isParticipationPlannerEnabled()) return [];
  return prisma.participationGoal.findMany({
    where: { participantId, status: { not: "cancelled" } },
    orderBy: { loggedAt: "desc" },
    take: 50,
  });
}

export async function completeParticipationGoal(params: {
  goalId: string;
  participantId: string;
}) {
  if (!isParticipationPlannerEnabled()) {
    throw new Error("PARTICIPATION_PLANNER_DISABLED");
  }

  const goal = await prisma.participationGoal.findFirst({
    where: { id: params.goalId, participantId: params.participantId },
  });
  if (!goal) throw new Error("GOAL_NOT_FOUND");

  return prisma.participationGoal.update({
    where: { id: goal.id },
    data: { status: "completed", completedAt: new Date() },
  });
}

export async function listParticipationGoalsForCoordinator(params: {
  coordinatorId: string;
  participantId: string;
}) {
  if (!isParticipationPlannerEnabled()) return { goals: [], note: "Planner disabled" };

  const allowed = await hasMicroConsent({
    action: "coordinator.participant_access",
    subjectUserId: params.participantId,
    grantedToUserId: params.coordinatorId,
  });
  if (!allowed) {
    return {
      goals: [],
      note: "Participant has not granted coordinator access to participation goals.",
    };
  }

  const goals = await listParticipationGoalsForParticipant(params.participantId);
  await createAuditEvent({
    actorUserId: params.coordinatorId,
    action: "participation.coordinator_view",
    entityType: "ParticipationGoal",
    participantId: params.participantId,
    metadata: { count: goals.length },
  });

  return { goals, note: "Read-only view — outcomes logging only, not funding advice." };
}
