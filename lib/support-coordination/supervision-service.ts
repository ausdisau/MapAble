import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  ensureSupportCoordinationEnabled,
  supportCoordinationConfig,
} from "@/lib/config/support-coordination";
import { prisma } from "@/lib/prisma";
import { requireCoordinatorAuthority } from "@/lib/support-coordinator/consent-gate";

export async function recordSupervision(input: {
  caseId: string;
  supervisorId: string;
  notes: string;
  actorUserId: string;
}) {
  ensureSupportCoordinationEnabled();
  if (!supportCoordinationConfig.supervisionEnabled) {
    throw new Error("COORDINATION_SUPERVISION_DISABLED");
  }

  const coordinationCase = await prisma.coordinationCase.findUnique({
    where: { id: input.caseId },
  });
  if (!coordinationCase) throw new Error("COORDINATION_CASE_NOT_FOUND");

  await requireCoordinatorAuthority({
    participantId: coordinationCase.participantId,
    coordinatorId: input.actorUserId,
    action: "manage",
  });

  const record = await prisma.coordinationSupervisionRecord.create({
    data: {
      caseId: input.caseId,
      supervisorId: input.supervisorId,
      notes: input.notes,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: coordinationCase.participantId,
    action: "coordination_supervision.recorded",
    entityType: "CoordinationSupervisionRecord",
    entityId: record.id,
  });

  return record;
}
