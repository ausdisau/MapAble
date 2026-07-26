import { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase6Config } from "@/lib/config/phase6";
import { prisma } from "@/lib/prisma";
import { getReportingSummary } from "@/lib/reporting/snapshot-service";

export async function draftGovernmentReportPack(params: {
  packType: string;
  title: string;
  createdById: string;
}) {
  if (!phase6Config.governmentReportingEnabled) {
    return { disabled: true, message: "Government reporting disabled" };
  }

  const reporting = await getReportingSummary();
  const pack = await prisma.governmentReportPack.create({
    data: {
      packType: params.packType,
      title: params.title,
      status: "draft",
      createdById: params.createdById,
      contentJson: {
        reporting,
        disclaimer: "Draft only — not auto-submitted to government systems.",
      } as Prisma.InputJsonValue,
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "government_report.drafted",
    entityType: "GovernmentReportPack",
    entityId: pack.id,
  });

  return pack;
}
