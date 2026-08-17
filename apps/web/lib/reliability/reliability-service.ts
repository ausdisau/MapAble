import { platformPatternsConfig } from "@/lib/config/platform-patterns";
import { prisma } from "@/lib/prisma";

export type ReliabilityAdvisory = {
  completionRate: number;
  lateRate: number;
  cancellationRate: number;
  incidentCount: number;
  complaintCount: number;
  advisorySummary: string;
};

export async function computeWorkerReliabilitySnapshot(
  workerProfileId: string,
  periodDays = 90
): Promise<ReliabilityAdvisory> {
  const periodEnd = new Date();
  const periodStart = new Date(
    periodEnd.getTime() - periodDays * 24 * 60 * 60 * 1000
  );

  const shifts = await prisma.careShift.findMany({
    where: {
      workerProfileId,
      startAt: { gte: periodStart, lte: periodEnd },
    },
    select: { status: true, startAt: true, checkInTime: true },
  });

  const total = shifts.length || 1;
  const completed = shifts.filter(
    (s) => s.status === "completed" || s.status === "approved"
  ).length;
  const cancelled = shifts.filter((s) => s.status === "cancelled").length;
  const late = shifts.filter(
    (s) =>
      s.checkInTime &&
      s.startAt &&
      s.checkInTime.getTime() > s.startAt.getTime() + 15 * 60 * 1000
  ).length;

  const [incidentCount, complaintCount] = await Promise.all([
    prisma.incidentReport.count({
      where: { workerProfileId, createdAt: { gte: periodStart } },
    }),
    prisma.complaint.count({
      where: {
        createdAt: { gte: periodStart },
        organisationId: (
          await prisma.workerProfile.findUnique({
            where: { id: workerProfileId },
            select: { organisationId: true },
          })
        )?.organisationId,
      },
    }),
  ]);

  const completionRate = completed / total;
  const cancellationRate = cancelled / total;
  const lateRate = late / total;

  const advisorySummary = buildAdvisoryText({
    completionRate,
    lateRate,
    cancellationRate,
    incidentCount,
    complaintCount,
  });

  if (platformPatternsConfig.reliabilityAdvisoryEnabled) {
    await prisma.reliabilitySnapshot.create({
      data: {
        workerProfileId,
        periodStart,
        periodEnd,
        completionRate,
        lateRate,
        cancellationRate,
        incidentCount,
        complaintCount,
        advisorySummary,
      },
    });
  }

  return {
    completionRate,
    lateRate,
    cancellationRate,
    incidentCount,
    complaintCount,
    advisorySummary,
  };
}

function buildAdvisoryText(metrics: {
  completionRate: number;
  lateRate: number;
  cancellationRate: number;
  incidentCount: number;
  complaintCount: number;
}) {
  const parts: string[] = [];
  parts.push(
    `Completed about ${Math.round(metrics.completionRate * 100)}% of shifts in this period (advisory only).`
  );
  if (metrics.lateRate > 0.1) {
    parts.push("Some shifts had late check-ins — worth discussing expectations.");
  }
  if (metrics.cancellationRate > 0.15) {
    parts.push("Cancellation rate is elevated — review scheduling fit.");
  }
  if (metrics.incidentCount > 0) {
    parts.push(
      `${metrics.incidentCount} incident report(s) on file — see safeguarding queue for detail.`
    );
  }
  if (metrics.complaintCount > 0) {
    parts.push(`${metrics.complaintCount} complaint(s) in period.`);
  }
  parts.push("This score does not automatically exclude workers from matching.");
  return parts.join(" ");
}

export async function getLatestReliabilityAdvisory(workerProfileId: string) {
  const snap = await prisma.reliabilitySnapshot.findFirst({
    where: { workerProfileId },
    orderBy: { periodEnd: "desc" },
  });
  if (!snap) {
    return computeWorkerReliabilitySnapshot(workerProfileId);
  }
  return {
    completionRate: snap.completionRate,
    lateRate: snap.lateRate,
    cancellationRate: snap.cancellationRate,
    incidentCount: snap.incidentCount,
    complaintCount: snap.complaintCount,
    advisorySummary: snap.advisorySummary ?? "",
  };
}
