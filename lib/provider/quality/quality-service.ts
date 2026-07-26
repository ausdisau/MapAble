import { phase6Config } from "@/lib/config/phase6";
import { prisma } from "@/lib/prisma";

export async function calculateProviderQualityScore(organisationId: string) {
  if (!phase6Config.providerQualityDashboardEnabled) {
    return { skipped: true };
  }

  const [incidents, completedShifts, openIncidents] = await Promise.all([
    prisma.incidentReport.count({ where: { organisationId } }),
    prisma.careShift.count({
      where: { organisationId, status: "completed" },
    }),
    prisma.incidentReport.count({
      where: {
        organisationId,
        status: { notIn: ["closed", "resolved"] },
      },
    }),
  ]);

  const incidentRate = completedShifts > 0 ? incidents / completedShifts : incidents;
  const score = Math.max(0, Math.min(1, 1 - incidentRate * 0.2 - openIncidents * 0.05));

  const factors = [
    { factor: "completed_shifts", value: completedShifts, weight: 0.4 },
    { factor: "incident_count", value: incidents, weight: -0.2 },
    { factor: "open_incidents", value: openIncidents, weight: -0.1 },
  ];

  const explanation =
    `Explainable quality index (${(score * 100).toFixed(0)}%). ` +
    `Based on ${completedShifts} completed shifts and ${incidents} incidents. ` +
    `Not punitive automation — requires human review for provider decisions.`;

  const record = await prisma.providerQualityScore.create({
    data: {
      organisationId,
      periodStart: new Date(Date.now() - 90 * 86400000),
      periodEnd: new Date(),
      score,
      factorsJson: factors,
      explanation,
    },
  });

  return { record, factors, explanation };
}

export async function getProviderQualityDashboard() {
  const scores = await prisma.providerQualityScore.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return { scores };
}
