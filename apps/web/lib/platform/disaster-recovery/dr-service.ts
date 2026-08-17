import { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase6Config } from "@/lib/config/phase6";
import { prisma } from "@/lib/prisma";

export async function recordDrExercise(params: {
  title: string;
  outcome: string;
  actorUserId: string;
  planId?: string;
}) {
  if (!phase6Config.disasterRecoveryExercisesEnabled) {
    throw new Error("DR_DISABLED");
  }

  const exercise = await prisma.disasterRecoveryExercise.create({
    data: {
      planId: params.planId,
      title: params.title,
      outcome: params.outcome,
      status: "completed",
      conductedAt: new Date(),
      evidenceJson: { recordedBy: params.actorUserId } as Prisma.InputJsonValue,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "disaster_recovery.exercise_completed",
    entityType: "DisasterRecoveryExercise",
    entityId: exercise.id,
  });

  return exercise;
}
