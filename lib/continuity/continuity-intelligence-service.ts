import { phase5Config } from "@/lib/config/phase5";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";
import { y3NationalTrustConfig } from "@/lib/config/y3-national-trust";
import { whereOrganisationScope } from "@/lib/multi-tenant-admin/tenant-context";
import { prisma } from "@/lib/prisma";

export type ContinuityBand = "stable" | "watch" | "at_risk";

export function isContinuityIntelligenceEnabled() {
  return y3NationalTrustConfig.continuityIntelligenceEnabled;
}

function suppressMetric(n: number) {
  if (n > 0 && n < phase5Config.smallCellSuppressionThreshold) {
    return { suppressed: true, value: null as number | null };
  }
  return { suppressed: false, value: n };
}

export async function computeParticipantContinuityScore(
  participantId: string,
  organisationId?: string
) {
  if (!isContinuityIntelligenceEnabled()) {
    return { band: "stable" as ContinuityBand, score: 0, enabled: false };
  }

  const shiftWhere = {
    participantId,
    ...(organisationId ? { organisationId } : {}),
    startAt: { gte: new Date(Date.now() - 90 * 86400000) },
  };

  const [completed, cancelled, recoveries] = await Promise.all([
    prisma.careShift.count({
      where: { ...shiftWhere, status: "completed" },
    }),
    prisma.careShift.count({
      where: { ...shiftWhere, status: { in: ["cancelled", "disputed"] } },
    }),
    prisma.backupShiftRecovery.findMany({
      where: {
        participantId,
        createdAt: { gte: new Date(Date.now() - 90 * 86400000) },
      },
      select: { status: true },
    }),
  ]);

  const total = completed + cancelled;
  const completionRate = total > 0 ? completed / total : 1;
  const backupSuccess = recoveries.filter((r) =>
    ["assigned", "closed"].includes(r.status)
  ).length;
  const backupRate =
    recoveries.length > 0 ? backupSuccess / recoveries.length : 1;

  const score = Math.round((completionRate * 0.6 + backupRate * 0.4) * 100);

  let band: ContinuityBand = "stable";
  if (score < 50 || cancelled >= 3) band = "at_risk";
  else if (score < 75 || cancelled >= 1) band = "watch";

  return {
    enabled: true,
    score,
    band,
    completedShifts: completed,
    cancelledShifts: cancelled,
    backupRecoveries: recoveries.length,
    lastBackupOutcome:
      recoveries.length > 0 ? recoveries[0]?.status ?? null : null,
  };
}

export async function computeContinuityAdjustedWeeks(params?: {
  organisationId?: string;
  tenantScope?: { tenantId: string | null; organisationId: string | null; enabled: boolean };
}) {
  if (!isContinuityIntelligenceEnabled()) {
    return { weeks: 0, enabled: false };
  }

  const orgFilter = params?.tenantScope
    ? whereOrganisationScope(params.tenantScope)
    : params?.organisationId
      ? { organisationId: params.organisationId }
      : {};

  const since = new Date(Date.now() - 52 * 7 * 86400000);
  const shifts = await prisma.careShift.findMany({
    where: {
      ...orgFilter,
      startAt: { gte: since },
      status: "completed",
    },
    select: { participantId: true, startAt: true, workerProfileId: true },
    orderBy: { startAt: "asc" },
  });

  const weekKeys = new Set<string>();
  const brokenWeeks = new Set<string>();

  for (const shift of shifts) {
    const weekStart = new Date(shift.startAt);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    const key = `${shift.participantId}:${weekStart.toISOString().slice(0, 10)}`;
    weekKeys.add(key);
  }

  const cancelled = await prisma.careShift.findMany({
    where: {
      ...orgFilter,
      startAt: { gte: since },
      status: { in: ["cancelled", "disputed"] },
    },
    select: { participantId: true, startAt: true },
  });

  for (const shift of cancelled) {
    const weekStart = new Date(shift.startAt);
    weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
    const key = `${shift.participantId}:${weekStart.toISOString().slice(0, 10)}`;
    brokenWeeks.add(key);
  }

  let adjustedWeeks = 0;
  for (const key of weekKeys) {
    if (!brokenWeeks.has(key)) adjustedWeeks++;
  }

  return { weeks: adjustedWeeks, enabled: true, totalParticipantWeeks: weekKeys.size };
}

export async function listAtRiskRelationships(params: {
  organisationId?: string;
  limit?: number;
}) {
  if (!isContinuityIntelligenceEnabled()) return [];

  const participants = await prisma.careShift.findMany({
    where: {
      ...(params.organisationId ? { organisationId: params.organisationId } : {}),
      startAt: { gte: new Date(Date.now() - 90 * 86400000) },
    },
    select: { participantId: true, organisationId: true },
    distinct: ["participantId"],
    take: params.limit ?? 50,
  });

  const atRisk: Array<{
    participantId: string;
    organisationId: string;
    band: ContinuityBand;
    score: number;
  }> = [];

  for (const p of participants) {
    const result = await computeParticipantContinuityScore(
      p.participantId,
      p.organisationId
    );
    if (result.band !== "stable") {
      atRisk.push({
        participantId: p.participantId,
        organisationId: p.organisationId,
        band: result.band,
        score: result.score,
      });
    }
  }

  return atRisk.sort((a, b) => a.score - b.score);
}

export async function captureContinuityMetricSnapshot(periodLabel: string, organisationId?: string) {
  if (!isContinuityIntelligenceEnabled()) {
    throw new Error("CONTINUITY_INTELLIGENCE_DISABLED");
  }

  const [adjusted, atRisk] = await Promise.all([
    computeContinuityAdjustedWeeks({ organisationId }),
    listAtRiskRelationships({ organisationId, limit: 100 }),
  ]);

  const metrics = {
    continuityAdjustedWeeks: suppressMetric(adjusted.weeks),
    atRiskRelationshipCount: suppressMetric(atRisk.length),
    capturedAt: new Date().toISOString(),
  };

  const anySuppressed = Object.values(metrics).some(
    (v) => typeof v === "object" && v !== null && "suppressed" in v && v.suppressed
  );

  return prisma.continuityMetricSnapshot.create({
    data: {
      organisationId,
      periodLabel,
      metricsJson: metrics,
      suppressed: anySuppressed,
    },
  });
}

export async function getLatestBackupRecoverySuccessRate() {
  const recoveries = await prisma.backupShiftRecovery.findMany({
    where: { createdAt: { gte: new Date(Date.now() - 90 * 86400000) } },
    select: { status: true },
  });
  if (recoveries.length === 0) return null;
  const success = recoveries.filter((r) =>
    ["assigned", "closed"].includes(r.status)
  ).length;
  return (success / recoveries.length) * 100;
}

export async function getLatestReconciliationUnpaidPercent() {
  if (!y2OrchestrationConfig.paymentReconciliationV2Enabled) return null;

  const batch = await prisma.paymentReconciliationBatch.findFirst({
    where: { status: "completed" },
    orderBy: { createdAt: "desc" },
  });
  if (!batch?.summaryJson || typeof batch.summaryJson !== "object") return null;
  const summary = batch.summaryJson as { unpaidPercent?: number };
  return summary.unpaidPercent ?? null;
}
