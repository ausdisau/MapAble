import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function scheduleComplianceRenewal(params: {
  controlCode: string;
  title: string;
  dueAt: Date;
}) {
  return prisma.complianceRenewal.create({
    data: params,
  });
}

export async function markRenewalComplete(
  renewalId: string,
  evidence?: Record<string, unknown>
) {
  return prisma.complianceRenewal.update({
    where: { id: renewalId },
    data: {
      status: "renewed",
      renewedAt: new Date(),
      evidenceJson: evidence
        ? (evidence as Prisma.InputJsonValue)
        : undefined,
    },
  });
}

export async function getComplianceRenewalsDashboard() {
  const renewals = await prisma.complianceRenewal.findMany({
    orderBy: { dueAt: "asc" },
    take: 40,
  });
  const overdue = renewals.filter(
    (r) => r.status !== "renewed" && r.dueAt < new Date()
  );
  return { renewals, overdueCount: overdue.length };
}
