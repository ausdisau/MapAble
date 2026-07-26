import { phase5Config } from "@/lib/config/phase5";
import { phase9Config } from "@/lib/config/phase9";
import {
  isLongTermOutcomesV2Enabled,
  OUTCOMES_NON_ADVISORY_DISCLAIMER,
} from "@/lib/config/y5-rights-infrastructure";
import { prisma } from "@/lib/prisma";

export async function publishLongTermOutcome(params: {
  periodLabel: string;
  outcomeKey: string;
  value: number;
  cohortSize: number;
  narrative?: string;
  waveLabel?: string;
  measurementPeriodStart?: Date;
  measurementPeriodEnd?: Date;
  continuityMetricKey?: string;
}) {
  const enabled =
    isLongTermOutcomesV2Enabled() || phase9Config.longitudinalImpactEnabled;
  if (!enabled) {
    throw new Error("OUTCOMES_DISABLED");
  }

  const suppressed =
    params.cohortSize > 0 &&
    params.cohortSize < phase5Config.smallCellSuppressionThreshold;

  return prisma.longTermOutcomeSnapshot.create({
    data: {
      periodLabel: params.periodLabel,
      waveLabel: params.waveLabel ?? params.periodLabel,
      outcomeKey: params.outcomeKey,
      value: suppressed ? null : params.value,
      cohortSize: suppressed ? null : params.cohortSize,
      suppressed,
      narrative: params.narrative,
      measurementPeriodStart: params.measurementPeriodStart,
      measurementPeriodEnd: params.measurementPeriodEnd,
      continuityMetricKey: params.continuityMetricKey,
      publishedAt: new Date(),
    },
  });
}

export async function publishOutcomeWave(params: {
  waveLabel: string;
  measurementPeriodStart: Date;
  measurementPeriodEnd: Date;
  outcomes: Array<{
    outcomeKey: string;
    value: number;
    cohortSize: number;
    narrative?: string;
    continuityMetricKey?: string;
  }>;
}) {
  if (!isLongTermOutcomesV2Enabled()) {
    throw new Error("OUTCOMES_V2_DISABLED");
  }

  const published = [];
  for (const outcome of params.outcomes) {
    const snapshot = await publishLongTermOutcome({
      periodLabel: params.waveLabel,
      waveLabel: params.waveLabel,
      measurementPeriodStart: params.measurementPeriodStart,
      measurementPeriodEnd: params.measurementPeriodEnd,
      ...outcome,
    });
    published.push(snapshot);
  }
  return published;
}

export async function listPublishedOutcomes() {
  return prisma.longTermOutcomeSnapshot.findMany({
    where: { publishedAt: { not: null } },
    orderBy: [{ waveLabel: "desc" }, { createdAt: "desc" }],
    take: 50,
  });
}

export async function listPublishedOutcomesByWave() {
  const outcomes = await listPublishedOutcomes();
  const waves = new Map<string, typeof outcomes>();
  for (const outcome of outcomes) {
    const key = outcome.waveLabel ?? outcome.periodLabel;
    const group = waves.get(key) ?? [];
    group.push(outcome);
    waves.set(key, group);
  }
  return Array.from(waves.entries()).map(([waveLabel, items]) => ({
    waveLabel,
    items,
  }));
}

export function getOutcomesDisclaimer() {
  return OUTCOMES_NON_ADVISORY_DISCLAIMER;
}
