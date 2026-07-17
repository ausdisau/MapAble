import {
  buildBulkPaymentRequestExport,
  checksumExport,
} from "@/lib/ndis/claiming/exporters/bulkPaymentRequestExporter";
import type { NdisClaimingAdapter } from "@/lib/ndis/claiming/types";
import { prisma } from "@/lib/prisma";

/**
 * Portal-assisted export — generates files for manual upload to myplace provider portal.
 * Does not scrape portals or store government credentials.
 */
export class PortalExportAdapter implements NdisClaimingAdapter {
  async submitClaimBatch(batchId: string): Promise<{ externalReference?: string }> {
    const exp = await buildBulkPaymentRequestExport(batchId);
    if (!exp) {
      throw new Error("BATCH_NOT_NDIA_MANAGED");
    }

    const checksum = checksumExport(exp.csv);
    const fileName = `ndia-bulk-payment-${exp.batchReference}.csv`;

    await prisma.ndisClaimBatch.update({
      where: { id: batchId },
      data: {
        status: "exported",
        exportFileName: fileName,
        exportChecksum: checksum,
        exportedAt: new Date(),
        metadataJson: {
          adapter: "portal_export",
          format: exp.format,
          lineCount: exp.lineCount,
          disclaimer:
            "Upload this file manually in the myplace provider portal. MapAble does not access government portals on your behalf.",
        },
      },
    });

    await prisma.ndisClaimLine.updateMany({
      where: { batchId },
      data: { status: "exported" },
    });

    await prisma.claimAuditEvent.create({
      data: {
        batchId,
        entityType: "ndis_claim_batch",
        entityId: batchId,
        action: "batch.exported.portal",
        afterJson: { fileName, checksum, lineCount: exp.lineCount },
      },
    });

    return { externalReference: fileName };
  }

  async getClaimStatus(externalReference: string): Promise<{ status: string }> {
    const batch = await prisma.ndisClaimBatch.findFirst({
      where: { exportFileName: externalReference },
    });
    return { status: batch?.status ?? "unknown" };
  }
}

export const portalExportAdapter = new PortalExportAdapter();
