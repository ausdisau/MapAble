import type { Prisma } from "@prisma/client";

import { ensureAnalyticsCloudEnabled } from "@/lib/config/analytics-research";
import {
  describeDeidentificationLevel,
  pseudonymiseParticipantId,
  suppressSensitiveFields,
} from "@/lib/platform/privacy/deidentification";
import { applySmallCellControls } from "@/lib/platform/privacy/deidentification/small-cell-controls";
import { prisma } from "@/lib/prisma";

export async function requestAnalyticsExport(params: {
  requestedById: string;
  exportLabel: string;
  organisationId?: string;
  deidentificationLevel?: "aggregated" | "pseudonymised" | "de-identified";
  records: Record<string, unknown>[];
  salt: string;
}) {
  ensureAnalyticsCloudEnabled();

  const processed: Record<string, unknown>[] = [];
  const allSuppressed: string[] = [];
  let smallCellApplied = false;

  for (const raw of params.records) {
    const { record, suppressedFields } = suppressSensitiveFields(raw);
    allSuppressed.push(...suppressedFields);

    if (record.participantId && typeof record.participantId === "string") {
      record.participantPseudonym = pseudonymiseParticipantId(
        record.participantId,
        params.salt,
      );
      delete record.participantId;
    }

    processed.push(record);
  }

  const cell = applySmallCellControls(processed.length, processed.length);
  if (cell.suppressed) {
    smallCellApplied = true;
  }

  return prisma.analyticsExport.create({
    data: {
      requestedById: params.requestedById,
      organisationId: params.organisationId,
      exportLabel: params.exportLabel,
      status: "pending_approval",
      deidentificationLevel: params.deidentificationLevel ?? "pseudonymised",
      suppressedFields: [...new Set(allSuppressed)],
      smallCellApplied,
      bundleJson: {
        recordCount: processed.length,
        deidentificationDescription: describeDeidentificationLevel(
          params.deidentificationLevel ?? "pseudonymised",
        ),
        records: cell.suppressed ? [] : processed,
        disclaimer:
          "This export is not anonymous. De-identification level is documented above.",
      } as Prisma.InputJsonValue,
    },
  });
}

export async function approveAnalyticsExport(
  exportId: string,
  approverId: string,
) {
  ensureAnalyticsCloudEnabled();

  const record = await prisma.analyticsExport.findUnique({
    where: { id: exportId },
  });
  if (!record) throw new Error("EXPORT_NOT_FOUND");
  if (record.status !== "pending_approval") {
    throw new Error("EXPORT_NOT_PENDING");
  }

  return prisma.analyticsExport.update({
    where: { id: exportId },
    data: {
      status: "approved",
      approvedById: approverId,
      approvedAt: new Date(),
    },
  });
}

export async function completeAnalyticsExport(exportId: string) {
  ensureAnalyticsCloudEnabled();

  const record = await prisma.analyticsExport.findUnique({
    where: { id: exportId },
  });
  if (!record || record.status !== "approved") {
    throw new Error("EXPORT_NOT_APPROVED");
  }

  return prisma.analyticsExport.update({
    where: { id: exportId },
    data: {
      status: "completed",
      completedAt: new Date(),
    },
  });
}

export async function rejectAnalyticsExport(
  exportId: string,
  approverId: string,
  reason: string,
) {
  ensureAnalyticsCloudEnabled();

  return prisma.analyticsExport.update({
    where: { id: exportId },
    data: {
      status: "rejected",
      approvedById: approverId,
      rejectionReason: reason,
    },
  });
}

export async function listAnalyticsExports(limit = 20) {
  if (!process.env.MAPABLE_ANALYTICS_CLOUD_ENABLED) {
    return { disabled: true as const, exports: [] };
  }

  const exports = await prisma.analyticsExport.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return { disabled: false as const, exports };
}
