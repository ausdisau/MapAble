import type {
  NdisClaimLineStatus,
  NdisPaymentRoute,
} from "@prisma/client";
import { Prisma } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { decryptNdisNumber, maskNdisNumber } from "@/lib/crypto/ndis";
import { persistPlanManagerInvoices } from "@/lib/ndis/claiming/adapters/PlanManagerInvoiceAdapter";
import { portalExportAdapter } from "@/lib/ndis/claiming/adapters/PortalExportAdapter";
import { persistSelfManagedInvoices } from "@/lib/ndis/claiming/adapters/SelfManagedInvoiceAdapter";
import { createClaimBatch, validateClaimBatch } from "@/lib/ndis/claiming/batchBuilder";
import {
  buildBulkPaymentRequestExport,
  checksumExport,
} from "@/lib/ndis/claiming/exporters/bulkPaymentRequestExporter";
import { fundingSourceToPaymentRoute } from "@/lib/ndis/claiming/paymentRoute";
import type {
  ClaimBatchExportResult,
  ClaimLineInput,
  ClaimLineStatusUpdate,
} from "@/lib/ndis/claiming/types";
import {
  mergeValidationJson,
  validateClaimLineInput,
  validationResultToStatus,
} from "@/lib/ndis/claiming/validation";
import { prisma } from "@/lib/prisma";

export async function assertOrgAccess(user: CurrentUser, organisationId: string) {
  if (isAdminRole(user.primaryRole)) return;
  const orgIds = await getUserOrganisationIds(user.id);
  if (!orgIds.includes(organisationId)) {
    throw new Error("FORBIDDEN");
  }
}

export async function createClaimLineFromBooking(params: {
  bookingId: string;
  providerOrgId: string;
  createdById: string;
  supportItemCode?: string;
  unitPriceCents?: number;
  quantity?: number;
  evidenceJson?: Record<string, unknown>;
  participantConfirmationException?: string;
}) {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: {
      participant: { include: { participantProfile: true } },
      fundingSource: true,
      careRequest: true,
      careShifts: {
        where: { status: { in: ["completed", "checked_out"] } },
        take: 5,
      },
      assignedOrganisation: true,
    },
  });

  if (!booking) throw new Error("BOOKING_NOT_FOUND");
  if (booking.status !== "completed") {
    throw new Error("BOOKING_NOT_COMPLETED");
  }
  if (booking.assignedOrganisationId !== params.providerOrgId) {
    throw new Error("BOOKING_ORG_MISMATCH");
  }

  const paymentRoute = fundingSourceToPaymentRoute(booking.fundingSource?.type);
  if (!paymentRoute) throw new Error("FUNDING_ROUTE_UNKNOWN");

  const supportItemCode =
    params.supportItemCode ??
    booking.careRequest?.supportItemCode ??
    "PENDING_CODE";
  const shift = booking.careShifts[0];
  const serviceStart = shift?.startAt ?? booking.requestedStart;
  const serviceEnd = shift?.endAt ?? booking.requestedEnd ?? serviceStart;

  const quantity = params.quantity ?? 1;
  const unitPriceCents = params.unitPriceCents ?? 0;
  const totalAmountCents = Math.round(quantity * unitPriceCents);

  const profile = booking.participant.participantProfile;
  const ndisRaw = profile?.ndisParticipantNumberEnc
    ? decryptNdisNumber(profile.ndisParticipantNumberEnc)
    : null;

  const evidenceJson: Record<string, unknown> = {
    deliveryRecorded: true,
    shiftIds: booking.careShifts.map((s) => s.id),
    bookingId: booking.id,
    bookingStatus: booking.status,
    ...params.evidenceJson,
  };
  if (params.participantConfirmationException) {
    evidenceJson.participantConfirmationException =
      params.participantConfirmationException;
  }

  const input: ClaimLineInput = {
    participantId: booking.participantId,
    providerOrgId: params.providerOrgId,
    bookingId: booking.id,
    ndisParticipantNumber: ndisRaw,
    participantName: booking.participant.name,
    supportItemCode,
    supportDescription: booking.careRequest?.supportItemCode
      ? `Support — ${supportItemCode}`
      : `Booking ${booking.id.slice(0, 8)}`,
    serviceStartDate: serviceStart.toISOString(),
    serviceEndDate: serviceEnd.toISOString(),
    quantity,
    unitPriceCents,
    totalAmountCents,
    paymentRoute,
    evidenceJson,
    participantConfirmationException: params.participantConfirmationException,
  };

  const validation = await validateClaimLineInput(input);
  const status = validationResultToStatus(validation);

  const line = await prisma.ndisClaimLine.create({
    data: {
      participantId: input.participantId,
      providerOrgId: input.providerOrgId,
      bookingId: input.bookingId,
      ndisParticipantNumber: ndisRaw ? maskNdisNumber(ndisRaw) : null,
      participantName: input.participantName,
      supportItemCode: input.supportItemCode.trim(),
      supportDescription: input.supportDescription,
      serviceStartDate: new Date(input.serviceStartDate),
      serviceEndDate: new Date(input.serviceEndDate),
      quantity: new Prisma.Decimal(input.quantity),
      unitPriceCents: input.unitPriceCents,
      totalAmountCents: input.totalAmountCents,
      paymentRoute: input.paymentRoute,
      status,
      evidenceJson: evidenceJson as Prisma.InputJsonValue,
      validationJson: mergeValidationJson(validation) as Prisma.InputJsonValue,
      createdById: params.createdById,
    },
  });

  await prisma.claimAuditEvent.create({
    data: {
      claimLineId: line.id,
      entityType: "ndis_claim_line",
      entityId: line.id,
      action: "line.created_from_booking",
      actorUserId: params.createdById,
      afterJson: { status, bookingId: booking.id },
    },
  });

  return { line, validation };
}

export async function validateClaimLineById(lineId: string, actorUserId: string) {
  const line = await prisma.ndisClaimLine.findUnique({ where: { id: lineId } });
  if (!line) throw new Error("LINE_NOT_FOUND");

  const input: ClaimLineInput = {
    participantId: line.participantId,
    providerOrgId: line.providerOrgId,
    bookingId: line.bookingId,
    ndisParticipantNumber: line.ndisParticipantNumber,
    participantName: line.participantName,
    supportItemCode: line.supportItemCode,
    supportDescription: line.supportDescription,
    serviceStartDate: line.serviceStartDate.toISOString(),
    serviceEndDate: line.serviceEndDate.toISOString(),
    quantity: Number(line.quantity),
    unitPriceCents: line.unitPriceCents,
    totalAmountCents: line.totalAmountCents,
    paymentRoute: line.paymentRoute,
    evidenceJson: (line.evidenceJson as Record<string, unknown>) ?? {},
    participantConfirmationException:
      (line.evidenceJson as Record<string, unknown>)
        ?.participantConfirmationException as string | undefined,
  };

  const validation = await validateClaimLineInput(input);
  const status = validationResultToStatus(validation);

  const updated = await prisma.ndisClaimLine.update({
    where: { id: lineId },
    data: {
      status,
      validationJson: mergeValidationJson(validation) as Prisma.InputJsonValue,
    },
  });

  await prisma.claimAuditEvent.create({
    data: {
      claimLineId: lineId,
      entityType: "ndis_claim_line",
      entityId: lineId,
      action: "line.validated",
      actorUserId,
      beforeJson: { status: line.status },
      afterJson: { status, valid: validation.valid },
    },
  });

  return { line: updated, validation };
}

export async function exportClaimBatch(
  batchId: string,
  actorUserId: string
): Promise<ClaimBatchExportResult> {
  const batch = await prisma.ndisClaimBatch.findUnique({
    where: { id: batchId },
    include: { providerOrg: true, lines: true },
  });
  if (!batch) throw new Error("BATCH_NOT_FOUND");

  let content = "";
  let contentType = "text/csv";
  let adapter: ClaimBatchExportResult["adapter"] = "portal_export";
  let fileName = `export-${batch.id}.csv`;

  if (batch.paymentRoute === "ndia_managed") {
    await portalExportAdapter.submitClaimBatch(batchId);
    const exp = await buildBulkPaymentRequestExport(batchId);
    if (!exp) throw new Error("EXPORT_FAILED");
    content = exp.csv;
    fileName = `ndia-bulk-payment-${exp.batchReference}.csv`;
    checksumExport(content);
  } else if (batch.paymentRoute === "self_managed") {
    await persistSelfManagedInvoices(batchId, actorUserId);
    const invs = await prisma.ndisInvoice.findMany({
      where: { providerOrgId: batch.providerOrgId, paymentRoute: "self_managed" },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
      take: batch.lines.length,
    });
    content = JSON.stringify(
      invs.map((i) => ({
        invoiceNumber: i.invoiceNumber,
        participantId: i.participantId,
        totalCents: i.totalCents,
        lines: i.lines,
      })),
      null,
      2
    );
    contentType = "application/json";
    adapter = "self_managed_invoice";
    fileName = `self-managed-invoices-${batch.batchReference ?? batch.id}.json`;
    await prisma.ndisClaimBatch.update({
      where: { id: batchId },
      data: { status: "exported", exportedAt: new Date(), exportFileName: fileName },
    });
  } else if (batch.paymentRoute === "plan_managed") {
    await persistPlanManagerInvoices(batchId, actorUserId);
    const invs = await prisma.ndisInvoice.findMany({
      where: { providerOrgId: batch.providerOrgId, paymentRoute: "plan_managed" },
      include: { lines: true },
      orderBy: { createdAt: "desc" },
      take: batch.lines.length,
    });
    content = JSON.stringify(
      invs.map((i) => ({
        invoiceNumber: i.invoiceNumber,
        planManagerName: i.planManagerName,
        totalCents: i.totalCents,
        lines: i.lines,
      })),
      null,
      2
    );
    contentType = "application/json";
    adapter = "plan_manager_invoice";
    fileName = `plan-manager-invoices-${batch.batchReference ?? batch.id}.json`;
    await prisma.ndisClaimBatch.update({
      where: { id: batchId },
      data: { status: "exported", exportedAt: new Date(), exportFileName: fileName },
    });
  }

  const checksum = checksumExport(content);
  await prisma.ndisClaimBatch.update({
    where: { id: batchId },
    data: { exportChecksum: checksum },
  });

  await prisma.claimAuditEvent.create({
    data: {
      batchId,
      entityType: "ndis_claim_batch",
      entityId: batchId,
      action: "batch.exported",
      actorUserId,
      afterJson: { fileName, adapter, lineCount: batch.lines.length },
    },
  });

  return {
    batchId,
    paymentRoute: batch.paymentRoute,
    adapter,
    fileName,
    checksum,
    contentType,
    payloadBase64: Buffer.from(content, "utf8").toString("base64"),
    lineCount: batch.lines.length,
  };
}

export async function markBatchSubmittedInPortal(
  batchId: string,
  actorUserId: string
) {
  const batch = await prisma.ndisClaimBatch.update({
    where: { id: batchId },
    data: {
      status: "submitted_in_portal",
      submittedAt: new Date(),
    },
  });

  await prisma.ndisClaimLine.updateMany({
    where: { batchId },
    data: { status: "submitted" },
  });

  await prisma.claimAuditEvent.create({
    data: {
      batchId,
      entityType: "ndis_claim_batch",
      entityId: batchId,
      action: "batch.marked_submitted_portal",
      actorUserId,
      afterJson: { status: batch.status },
    },
  });

  return batch;
}

const STATUS_MAP: Record<ClaimLineStatusUpdate, NdisClaimLineStatus> = {
  submitted: "submitted",
  pending: "pending",
  paid: "paid",
  rejected: "rejected",
  corrected: "corrected",
  resubmitted: "resubmitted",
  voided: "voided",
};

export async function updateClaimLineStatus(params: {
  lineId: string;
  status: ClaimLineStatusUpdate;
  actorUserId: string;
  rejectionCode?: string;
  rejectionMessage?: string;
}) {
  const line = await prisma.ndisClaimLine.findUnique({ where: { id: params.lineId } });
  if (!line) throw new Error("LINE_NOT_FOUND");

  const nextStatus = STATUS_MAP[params.status];
  const updated = await prisma.ndisClaimLine.update({
    where: { id: params.lineId },
    data: {
      status: nextStatus,
      rejectionCode: params.rejectionCode ?? line.rejectionCode,
      rejectionMessage: params.rejectionMessage ?? line.rejectionMessage,
    },
  });

  await prisma.claimAuditEvent.create({
    data: {
      claimLineId: params.lineId,
      batchId: line.batchId,
      entityType: "ndis_claim_line",
      entityId: params.lineId,
      action: `line.status.${params.status}`,
      actorUserId: params.actorUserId,
      beforeJson: { status: line.status },
      afterJson: { status: nextStatus },
    },
  });

  return updated;
}

export async function correctAndResubmitClaimLine(params: {
  originalLineId: string;
  corrections: Partial<ClaimLineInput>;
  actorUserId: string;
}) {
  const original = await prisma.ndisClaimLine.findUnique({
    where: { id: params.originalLineId },
  });
  if (!original) throw new Error("LINE_NOT_FOUND");
  if (original.status !== "rejected") {
    throw new Error("LINE_NOT_REJECTED");
  }

  await updateClaimLineStatus({
    lineId: original.id,
    status: "corrected",
    actorUserId: params.actorUserId,
  });

  const input: ClaimLineInput = {
    participantId: original.participantId,
    providerOrgId: original.providerOrgId,
    bookingId: original.bookingId,
    ndisParticipantNumber: original.ndisParticipantNumber,
    participantName: original.participantName,
    supportItemCode: params.corrections.supportItemCode ?? original.supportItemCode,
    supportDescription:
      params.corrections.supportDescription ?? original.supportDescription,
    serviceStartDate:
      params.corrections.serviceStartDate ?? original.serviceStartDate.toISOString(),
    serviceEndDate:
      params.corrections.serviceEndDate ?? original.serviceEndDate.toISOString(),
    quantity: params.corrections.quantity ?? Number(original.quantity),
    unitPriceCents: params.corrections.unitPriceCents ?? original.unitPriceCents,
    totalAmountCents:
      params.corrections.totalAmountCents ?? original.totalAmountCents,
    paymentRoute: original.paymentRoute,
    evidenceJson:
      params.corrections.evidenceJson ??
      ((original.evidenceJson as Record<string, unknown>) ?? {}),
  };

  const validation = await validateClaimLineInput(input);
  const status = validationResultToStatus(validation);

  const newLine = await prisma.ndisClaimLine.create({
    data: {
      participantId: input.participantId,
      providerOrgId: input.providerOrgId,
      bookingId: input.bookingId,
      correctedFromLineId: original.id,
      ndisParticipantNumber: original.ndisParticipantNumber,
      participantName: input.participantName,
      supportItemCode: input.supportItemCode.trim(),
      supportDescription: input.supportDescription,
      serviceStartDate: new Date(input.serviceStartDate),
      serviceEndDate: new Date(input.serviceEndDate),
      quantity: new Prisma.Decimal(input.quantity),
      unitPriceCents: input.unitPriceCents,
      totalAmountCents: input.totalAmountCents,
      paymentRoute: input.paymentRoute,
      status: validation.valid ? "resubmitted" : status,
      evidenceJson: input.evidenceJson as Prisma.InputJsonValue,
      validationJson: mergeValidationJson(validation) as Prisma.InputJsonValue,
      createdById: params.actorUserId,
    },
  });

  await prisma.claimAuditEvent.create({
    data: {
      claimLineId: newLine.id,
      entityType: "ndis_claim_line",
      entityId: newLine.id,
      action: "line.resubmitted",
      actorUserId: params.actorUserId,
      metadataJson: { correctedFromLineId: original.id },
      afterJson: { status: newLine.status },
    },
  });

  return { original, newLine, validation };
}

export async function searchClaimLines(params: {
  providerOrgId: string;
  status?: NdisClaimLineStatus;
  paymentRoute?: NdisPaymentRoute;
  q?: string;
  limit?: number;
}) {
  const where: Prisma.NdisClaimLineWhereInput = {
    providerOrgId: params.providerOrgId,
  };
  if (params.status) where.status = params.status;
  if (params.paymentRoute) where.paymentRoute = params.paymentRoute;
  if (params.q?.trim()) {
    where.OR = [
      { participantName: { contains: params.q, mode: "insensitive" } },
      { supportItemCode: { contains: params.q, mode: "insensitive" } },
      { bookingId: params.q },
    ];
  }

  return prisma.ndisClaimLine.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: params.limit ?? 50,
    select: {
      id: true,
      status: true,
      paymentRoute: true,
      participantName: true,
      supportItemCode: true,
      serviceStartDate: true,
      totalAmountCents: true,
      bookingId: true,
      batchId: true,
      rejectionCode: true,
      rejectionMessage: true,
      validationJson: true,
      createdAt: true,
    },
  });
}

export { createClaimBatch, validateClaimBatch };
