import { phase5Config } from "@/lib/config/phase5";
import {
  BENCHMARK_DISCLAIMER,
  y4CivicPlatformConfig,
} from "@/lib/config/y4-civic-platform";
import {
  computeContinuityAdjustedWeeks,
  getLatestBackupRecoverySuccessRate,
  isContinuityIntelligenceEnabled,
} from "@/lib/continuity/continuity-intelligence-service";
import { prisma } from "@/lib/prisma";

export async function captureProviderBenchmark(params: {
  organisationId?: string;
  metricKey: string;
  value: number;
  cohortSize: number;
  periodLabel: string;
}) {
  const suppressed =
    params.cohortSize > 0 &&
    params.cohortSize < phase5Config.smallCellSuppressionThreshold;

  return prisma.providerBenchmarkSnapshot.create({
    data: {
      organisationId: params.organisationId,
      metricKey: params.metricKey,
      value: suppressed ? null : params.value,
      cohortSize: params.cohortSize,
      suppressed,
      periodLabel: params.periodLabel,
    },
  });
}

export async function captureContinuityBenchmarks(organisationId: string) {
  if (
    !y4CivicPlatformConfig.providerBenchmarkingV2Enabled ||
    !isContinuityIntelligenceEnabled()
  ) {
    return [];
  }

  const periodLabel = new Date().toISOString().slice(0, 7);
  const [weeks, recoveryRate] = await Promise.all([
    computeContinuityAdjustedWeeks({ organisationId }),
    getLatestBackupRecoverySuccessRate(),
  ]);

  const snapshots = [];

  if (weeks.enabled) {
    snapshots.push(
      await captureProviderBenchmark({
        organisationId,
        metricKey: "continuity_adjusted_weeks",
        value: weeks.weeks,
        cohortSize: weeks.totalParticipantWeeks ?? 0,
        periodLabel,
      })
    );
  }

  if (recoveryRate !== null) {
    snapshots.push(
      await captureProviderBenchmark({
        organisationId,
        metricKey: "backup_recovery_success_rate",
        value: recoveryRate,
        cohortSize: 10,
        periodLabel,
      })
    );
  }

  return snapshots;
}

export async function getProviderBenchmarkDashboard(organisationId?: string) {
  const snapshots = await prisma.providerBenchmarkSnapshot.findMany({
    where: organisationId ? { organisationId } : {},
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return {
    snapshots: snapshots.map((s) => ({
      ...s,
      displayValue: s.suppressed ? null : s.value,
    })),
    disclaimer: BENCHMARK_DISCLAIMER,
  };
}

export async function getSafeguardedBenchmarksForOrg(organisationId: string) {
  if (!y4CivicPlatformConfig.providerBenchmarkingV2Enabled) {
    return { disabled: true, snapshots: [], disclaimer: BENCHMARK_DISCLAIMER };
  }

  const snapshots = await prisma.providerBenchmarkSnapshot.findMany({
    where: { organisationId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return {
    disabled: false,
    disclaimer: BENCHMARK_DISCLAIMER,
    snapshots: snapshots.map((s) => ({
      metricKey: s.metricKey,
      periodLabel: s.periodLabel,
      displayValue: s.suppressed ? null : s.value,
      suppressed: s.suppressed,
      cohortSize: s.cohortSize,
    })),
  };
}
