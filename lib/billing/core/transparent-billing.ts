import type { BillingAdminApprovalStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { platformPatternsConfig } from "@/lib/config/platform-patterns";
import { prisma } from "@/lib/prisma";

export type InvoiceAnomalyFlag = {
  code: string;
  message: string;
};

export function detectInvoiceAnomalies(params: {
  scheduledMinutes?: number;
  billedMinutes?: number;
  lineCount: number;
  duplicateDescriptions: string[];
}): InvoiceAnomalyFlag[] {
  const flags: InvoiceAnomalyFlag[] = [];
  if (
    params.scheduledMinutes != null &&
    params.billedMinutes != null &&
    params.billedMinutes > params.scheduledMinutes * 1.25
  ) {
    flags.push({
      code: "hours_over_scheduled",
      message: "Billed time is more than 25% above scheduled time",
    });
  }
  if (params.duplicateDescriptions.length > 0) {
    flags.push({
      code: "duplicate_lines",
      message: "Duplicate line descriptions detected",
    });
  }
  if (params.lineCount === 0) {
    flags.push({
      code: "no_lines",
      message: "Invoice has no line items",
    });
  }
  return flags;
}

export async function createDraftFromCareShift(params: {
  careShiftId: string;
  actorUserId: string;
  providerId?: string;
}) {
  if (!platformPatternsConfig.transparentBillingEnabled) {
    throw new Error("TRANSPARENT_BILLING_DISABLED");
  }

  const shift = await prisma.careShift.findUnique({
    where: { id: params.careShiftId },
    include: {
      careServiceLog: true,
      participant: true,
    },
  });
  if (!shift) throw new Error("NOT_FOUND");

  const logs = shift.careServiceLog ? [shift.careServiceLog] : [];
  if (logs.length === 0) {
    throw new Error("EVIDENCE_REQUIRED");
  }

  const durationHours =
    (shift.endAt.getTime() - shift.startAt.getTime()) / (1000 * 60 * 60);
  const billedMinutes = logs.reduce(
    (sum, l) => sum + (l.durationMinutes ?? 0),
    0
  );
  const scheduledMinutes = durationHours * 60;

  const descriptions = logs.map((l) => l.notes ?? "Support session");
  const dupes = descriptions.filter(
    (d, i) => descriptions.indexOf(d) !== i
  );

  const anomalyFlags = detectInvoiceAnomalies({
    scheduledMinutes,
    billedMinutes,
    lineCount: logs.length,
    duplicateDescriptions: dupes,
  });

  const invoice = await prisma.billingInvoice.create({
    data: {
      userId: shift.participantId,
      providerId: params.providerId ?? shift.organisationId,
      serviceType: "care",
      status: "draft",
      adminApprovalStatus: "pending_approval",
      subtotalCents: Math.round(billedMinutes * 100),
      totalCents: Math.round(billedMinutes * 100),
      anomalyFlags,
      lineItems: {
        create: logs.map((log) => ({
          description: log.notes ?? "Care support",
          quantity: (log.durationMinutes ?? 60) / 60,
          unitAmountCents: 10000,
          totalCents: Math.round(((log.durationMinutes ?? 60) / 60) * 10000),
          evidence: {
            create: {
              careServiceLogId: log.id,
              careShiftId: shift.id,
              participantSafeDescription:
                log.notes ?? "Support delivered as scheduled",
            },
          },
        })),
      },
    },
    include: { lineItems: { include: { evidence: true } } },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "billing.invoice_draft_created",
    entityType: "BillingInvoice",
    entityId: invoice.id,
    participantId: shift.participantId,
    metadata: { anomalyCount: anomalyFlags.length },
  });

  return invoice;
}

export async function approveBillingInvoice(
  invoiceId: string,
  adminUserId: string
) {
  const invoice = await prisma.billingInvoice.update({
    where: { id: invoiceId },
    data: {
      adminApprovalStatus: "approved" satisfies BillingAdminApprovalStatus,
      status: "issued",
    },
  });

  await createAuditEvent({
    actorUserId: adminUserId,
    action: "billing.invoice_approved",
    entityType: "BillingInvoice",
    entityId: invoiceId,
    participantId: invoice.userId,
  });

  return invoice;
}

export async function disputeBillingInvoice(
  invoiceId: string,
  participantUserId: string,
  reason: string
) {
  const invoice = await prisma.billingInvoice.update({
    where: { id: invoiceId, userId: participantUserId },
    data: {
      adminApprovalStatus: "disputed",
      disputedAt: new Date(),
      disputeReason: reason,
      status: "draft",
    },
  });

  await createAuditEvent({
    actorUserId: participantUserId,
    action: "billing.invoice_disputed",
    entityType: "BillingInvoice",
    entityId: invoiceId,
    participantId: participantUserId,
  });

  return invoice;
}

export function assertInvoiceApprovedForExport(invoice: {
  adminApprovalStatus: BillingAdminApprovalStatus;
}) {
  if (invoice.adminApprovalStatus !== "approved") {
    throw new Error("INVOICE_NOT_APPROVED");
  }
}
