import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isXeroConfigured } from "@/lib/config/phase2";
import { phase5Config, integrationDisabledMessage } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

const SAFE_DESCRIPTION = "Support services — details in MapAble records";

export function buildSafeXeroInvoicePayload(invoice: {
  id: string;
  lines: { description: string; quantity: number; unitAmountCents: number }[];
}) {
  return {
    reference: invoice.id,
    lineItems: invoice.lines.map((l) => ({
      description: SAFE_DESCRIPTION,
      quantity: l.quantity,
      unitAmount: l.unitAmountCents / 100,
    })),
  };
}

/**
 * Build an honest Xero export pack. Does not claim live OAuth sync as SoT.
 * Returns `export_pack_ready` — NDIA/live invoice push remains stubbed.
 */
export async function syncInvoiceToXero(invoiceId: string, actorUserId: string) {
  if (!phase5Config.xeroEnabled || !isXeroConfigured()) {
    return { ok: false as const, ...integrationDisabledMessage("Xero") };
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { lines: true },
  });
  if (!invoice) throw new Error("NOT_FOUND");

  const payload = buildSafeXeroInvoicePayload({
    id: invoice.id,
    lines: invoice.lines.map((l) => ({
      description: l.description,
      quantity: Number(l.quantity),
      unitAmountCents: l.unitAmountCents,
    })),
  });

  const existing = await prisma.xeroInvoiceSyncRecord.findFirst({
    where: { invoiceId },
  });
  const record = existing
    ? await prisma.xeroInvoiceSyncRecord.update({
        where: { id: existing.id },
        data: {
          syncStatus: "export_pack_ready",
          xeroInvoiceId: null,
          syncedAt: null,
          lastError: "Live Xero sync disabled — export pack only",
        },
      })
    : await prisma.xeroInvoiceSyncRecord.create({
        data: {
          invoiceId,
          syncStatus: "export_pack_ready",
          xeroInvoiceId: null,
          syncedAt: null,
          lastError: "Live Xero sync disabled — export pack only",
        },
      });

  await prisma.xeroSyncLog.create({
    data: {
      invoiceId,
      action: "invoice_export_pack",
      status: "export_pack_ready",
      message:
        "Export pack ready — refuse live sync claims; configure OAuth only after human SoT review",
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "xero.export_pack_ready",
    entityType: "Invoice",
    entityId: invoiceId,
    participantId: invoice.participantId,
    metadata: { liveSync: false, status: "export_pack_ready" },
  });

  return {
    ok: true as const,
    status: "export_pack_ready" as const,
    liveSync: false as const,
    record,
    payload,
  };
}
