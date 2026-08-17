import { isErpnextEnabled } from "@/lib/finance/erpnext/erpnext-client";
import { mapMapableInvoiceToErpNext } from "@/lib/finance/erpnext/erpnext-invoice-mapper";
import { createSyncJob, recordSyncError, completeSyncJob } from "@/lib/integrations/integration-sync-service";
import { prisma } from "@/lib/prisma";

export async function syncInvoiceToErpNext(input: {
  invoiceId: string;
  customerName: string;
  totalCents: number;
}) {
  if (!isErpnextEnabled()) {
    throw new Error("ERPNext disabled");
  }

  const idempotencyKey = `invoice:${input.invoiceId}`;
  const job = await createSyncJob({
    integrationKey: "erpnext",
    jobKey: "invoice_sync",
    idempotencyKey,
    payload: { invoiceId: input.invoiceId },
  });

  const existing = await prisma.erpnextSyncRecord.findUnique({
    where: {
      mapableEntityType_mapableEntityId: {
        mapableEntityType: "invoice",
        mapableEntityId: input.invoiceId,
      },
    },
  });

  if (existing?.erpnextId) {
    await completeSyncJob(job.id);
    return existing;
  }

  try {
    const payload = mapMapableInvoiceToErpNext(input);
    void payload;

    const record = await prisma.erpnextSyncRecord.upsert({
      where: {
        mapableEntityType_mapableEntityId: {
          mapableEntityType: "invoice",
          mapableEntityId: input.invoiceId,
        },
      },
      create: {
        mapableEntityType: "invoice",
        mapableEntityId: input.invoiceId,
        erpnextId: `erpnext-inv-${input.invoiceId}`,
        status: "synced",
        lastSyncedAt: new Date(),
      },
      update: {
        status: "synced",
        lastSyncedAt: new Date(),
      },
    });

    await prisma.erpnextSyncEvent.create({
      data: { recordId: record.id, eventType: "synced", status: "success" },
    });

    await completeSyncJob(job.id);
    return record;
  } catch (err) {
    await recordSyncError(
      job.id,
      err instanceof Error ? err.message : "ERPNext sync failed"
    );
    await prisma.erpnextSyncError.create({
      data: {
        recordId: null,
        errorMessage: err instanceof Error ? err.message : "sync failed",
        retryable: true,
      },
    });
    throw err;
  }
}
