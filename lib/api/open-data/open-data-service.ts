import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { phase5Config } from "@/lib/config/phase5";
import { phase6Config } from "@/lib/config/phase6";
import { prisma } from "@/lib/prisma";

export async function generateOpenDataExport(
  datasetKey: string,
  createdById: string
) {
  if (!phase6Config.openDataExportEnabled) {
    return {
      disabled: true,
      message: "Open data export disabled. Enable OPEN_DATA_EXPORT_ENABLED for pilot.",
    };
  }

  const places = await prisma.accessiblePlace.findMany({
    select: {
      id: true,
      name: true,
      confidence: true,
      address: true,
    },
    take: 500,
  });

  let suppressed = 0;
  const safe = places.map((p) => {
    if (!p.address || p.address.length < 5) {
      suppressed++;
      return { region: "aggregated", featureCount: 1, confidence: p.confidence };
    }
    return {
      placeId: p.id,
      name: p.name,
      confidence: p.confidence,
    };
  });

  const exportRecord = await prisma.openDataExport.create({
    data: {
      datasetKey,
      status: "generated",
      recordCount: safe.length,
      suppressedCount: suppressed,
      createdById,
    },
  });

  await createAuditEvent({
    actorUserId: createdById,
    action: "open_data.export_generated",
    entityType: "OpenDataExport",
    entityId: exportRecord.id,
  });

  return {
    export: exportRecord,
    data: safe,
    suppressed,
    threshold: phase5Config.smallCellSuppressionThreshold,
    disclaimer: "Aggregate accessibility insights only — no participant PII.",
  };
}
