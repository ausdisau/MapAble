import type { Prisma } from "@prisma/client";

import { analyticsResearchConfig, ensureAnalyticsCloudEnabled } from "@/lib/config/analytics-research";
import { prisma } from "@/lib/prisma";

export type MetricRegistryEntry = {
  key: string;
  name: string;
  description: string;
  unit?: string;
  module: string;
  dimensions?: Array<{ key: string; label: string; dataType?: string }>;
};

export const CORE_METRICS: MetricRegistryEntry[] = [
  {
    key: "care.shifts.completed",
    name: "Completed care shifts",
    description: "Care shifts marked completed in period",
    unit: "count",
    module: "care",
    dimensions: [{ key: "organisationId", label: "Organisation", dataType: "string" }],
  },
  {
    key: "transport.bookings.completed",
    name: "Completed transport bookings",
    description: "Transport bookings completed in period",
    unit: "count",
    module: "transport",
  },
  {
    key: "incidents.open.critical",
    name: "Open critical incidents",
    description: "Incidents with critical severity not yet resolved",
    unit: "count",
    module: "safeguarding",
  },
  {
    key: "engagement.nps.response_rate",
    name: "NPS response rate",
    description: "Share of invited participants who responded to NPS",
    unit: "ratio",
    module: "engagement",
  },
];

export async function seedMetricRegistry() {
  ensureAnalyticsCloudEnabled();

  for (const metric of CORE_METRICS) {
    const definition = await prisma.metricDefinition.upsert({
      where: { key: metric.key },
      create: {
        key: metric.key,
        name: metric.name,
        description: metric.description,
        unit: metric.unit,
        module: metric.module,
        status: "published",
      },
      update: {
        name: metric.name,
        description: metric.description,
        unit: metric.unit,
        status: "published",
      },
    });

    for (const dim of metric.dimensions ?? []) {
      await prisma.metricDimension.upsert({
        where: {
          metricDefinitionId_key: {
            metricDefinitionId: definition.id,
            key: dim.key,
          },
        },
        create: {
          metricDefinitionId: definition.id,
          key: dim.key,
          label: dim.label,
          dataType: dim.dataType ?? "string",
        },
        update: {
          label: dim.label,
          dataType: dim.dataType ?? "string",
        },
      });
    }
  }
}

export async function listPublishedMetrics(module?: string) {
  if (!analyticsResearchConfig.analyticsCloudEnabled) {
    return { disabled: true as const, metrics: [] };
  }

  const metrics = await prisma.metricDefinition.findMany({
    where: {
      status: "published",
      ...(module ? { module } : {}),
    },
    include: { dimensions: true },
    orderBy: { key: "asc" },
  });

  return { disabled: false as const, metrics };
}

export async function recordAnalyticsEvent(params: {
  eventType: string;
  payload: Record<string, unknown>;
  metricKey?: string;
  organisationId?: string;
  participantPseudonym?: string;
  occurredAt?: Date;
}) {
  ensureAnalyticsCloudEnabled();

  let metricDefinitionId: string | undefined;
  if (params.metricKey) {
    const metric = await prisma.metricDefinition.findUnique({
      where: { key: params.metricKey },
    });
    metricDefinitionId = metric?.id;
  }

  return prisma.analyticsEvent.create({
    data: {
      eventType: params.eventType,
      metricDefinitionId,
      organisationId: params.organisationId,
      participantPseudonym: params.participantPseudonym,
      payloadJson: params.payload as Prisma.InputJsonValue,
      occurredAt: params.occurredAt ?? new Date(),
      status: "received",
    },
  });
}

export async function createMetricSnapshot(params: {
  metricKey: string;
  periodStart: Date;
  periodEnd: Date;
  value: number;
  cohortSize: number;
  dimensions?: Record<string, unknown>;
  deidentificationLevel?: string;
}) {
  ensureAnalyticsCloudEnabled();

  const metric = await prisma.metricDefinition.findUnique({
    where: { key: params.metricKey },
  });
  if (!metric) throw new Error("METRIC_NOT_FOUND");

  const { applySmallCellControls } = await import(
    "@/lib/platform/privacy/deidentification/small-cell-controls"
  );
  const cell = applySmallCellControls(params.value, params.cohortSize);

  return prisma.metricSnapshot.create({
    data: {
      metricDefinitionId: metric.id,
      periodStart: params.periodStart,
      periodEnd: params.periodEnd,
      value: cell.suppressed ? null : params.value,
      cohortSize: params.cohortSize,
      suppressed: cell.suppressed,
      suppressionReason: cell.reason,
      deidentificationLevel: params.deidentificationLevel ?? "aggregated",
      dimensionsJson: params.dimensions as Prisma.InputJsonValue | undefined,
    },
  });
}
