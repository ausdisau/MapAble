import { isXeroConfigured } from "@/lib/config/phase2";
import { prisma } from "@/lib/prisma";

export function xeroNotConfiguredResponse() {
  return {
    configured: false,
    message: "Xero not configured",
  };
}

export function getXeroOAuthStartUrl(): { ok: boolean; url?: string; message?: string } {
  if (!isXeroConfigured()) {
    return { ok: false, ...xeroNotConfiguredResponse() };
  }
  return {
    ok: true,
    url: "/api/xero/oauth/start?configured=placeholder",
    message: "Xero OAuth is not fully implemented in Phase 2",
  };
}

export async function syncInvoiceToXeroPlaceholder(invoiceId: string) {
  if (!isXeroConfigured()) {
    return { ok: false as const, ...xeroNotConfiguredResponse() };
  }

  const existing = await prisma.xeroInvoiceSyncRecord.findFirst({
    where: { invoiceId },
  });
  const record = existing
    ? await prisma.xeroInvoiceSyncRecord.update({
        where: { id: existing.id },
        data: {
          syncStatus: "pending",
          lastError: "Full Xero sync not implemented in Phase 2",
        },
      })
    : await prisma.xeroInvoiceSyncRecord.create({
        data: {
          invoiceId,
          syncStatus: "pending",
          lastError: "Full Xero sync not implemented in Phase 2",
        },
      });

  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { status: "xero_sync_pending" },
  });

  return { ok: true as const, record };
}

export async function getXeroSyncStatus(invoiceId: string) {
  const record = await prisma.xeroInvoiceSyncRecord.findFirst({
    where: { invoiceId },
    orderBy: { createdAt: "desc" },
  });
  if (!record) {
    return { status: "not_started", configured: isXeroConfigured() };
  }
  return { status: record.syncStatus, record, configured: isXeroConfigured() };
}
