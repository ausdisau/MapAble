import type { DataVaultRequestType } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  HUMAN_REVIEW_DISCLAIMER,
  isDataVaultV2Enabled,
} from "@/lib/config/y4-civic-platform";
import { prisma } from "@/lib/prisma";

export async function requestDataVaultExport(
  userId: string,
  requestType: DataVaultRequestType
) {
  if (!isDataVaultV2Enabled()) {
    throw new Error("DATA_VAULT_DISABLED");
  }

  const request = await prisma.personalDataVaultRequest.create({
    data: { userId, requestType, status: "pending" },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "data_vault.requested",
    entityType: "PersonalDataVaultRequest",
    entityId: request.id,
  });

  return {
    request,
    message: HUMAN_REVIEW_DISCLAIMER,
  };
}

export async function assembleExportBundle(userId: string) {
  const [user, supportProfile, consents, shifts, bookings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        primaryRole: true,
        createdAt: true,
      },
    }),
    prisma.supportProfile.findFirst({
      where: { participantId: userId },
      select: {
        id: true,
        version: true,
        routinesJson: true,
        preferencesJson: true,
        updatedAt: true,
      },
    }),
    prisma.consentRecord.findMany({
      where: { subjectUserId: userId },
      select: {
        id: true,
        scope: true,
        status: true,
        expiryDate: true,
        createdAt: true,
      },
      take: 50,
    }),
    prisma.careShift.findMany({
      where: { participantId: userId },
      select: {
        id: true,
        status: true,
        startAt: true,
        endAt: true,
      },
      take: 30,
      orderBy: { startAt: "desc" },
    }),
    prisma.booking.findMany({
      where: { participantId: userId },
      select: {
        id: true,
        status: true,
        requestedStart: true,
      },
      take: 30,
      orderBy: { requestedStart: "desc" },
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    userId,
    profile: user,
    supportProfile,
    consentRecords: consents,
    careShiftSummaries: shifts,
    bookingSummaries: bookings,
    disclaimer: HUMAN_REVIEW_DISCLAIMER,
    note: "No clinical notes included — consent-scoped manifest only.",
  };
}

export async function approveVaultRequest(requestId: string, actorUserId: string) {
  const request = await prisma.personalDataVaultRequest.findUnique({
    where: { id: requestId },
  });
  if (!request || request.status !== "pending") {
    throw new Error("VAULT_REQUEST_NOT_PENDING");
  }

  const bundle =
    request.requestType === "deletion_review"
      ? null
      : await assembleExportBundle(request.userId);

  const updated = await prisma.personalDataVaultRequest.update({
    where: { id: requestId },
    data: {
      status: "approved",
      reviewedBy: actorUserId,
      reviewedAt: new Date(),
      bundleJson: bundle ? (bundle as Prisma.InputJsonValue) : Prisma.JsonNull,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "data_vault.approved",
    entityType: "PersonalDataVaultRequest",
    entityId: requestId,
  });

  if (bundle) {
    await createAuditEvent({
      actorUserId,
      action: "data_vault.bundle_generated",
      entityType: "PersonalDataVaultRequest",
      entityId: requestId,
    });
  }

  return updated;
}

export async function rejectVaultRequest(
  requestId: string,
  reason: string,
  actorUserId: string
) {
  const request = await prisma.personalDataVaultRequest.update({
    where: { id: requestId },
    data: {
      status: "rejected",
      rejectionReason: reason,
      reviewedBy: actorUserId,
      reviewedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "data_vault.rejected",
    entityType: "PersonalDataVaultRequest",
    entityId: requestId,
  });

  return request;
}

export async function completeVaultRequest(requestId: string, actorUserId: string) {
  const existing = await prisma.personalDataVaultRequest.findUnique({
    where: { id: requestId },
  });
  if (!existing) throw new Error("VAULT_REQUEST_NOT_FOUND");
  if (existing.status === "rejected") {
    throw new Error("VAULT_REQUEST_REJECTED");
  }
  if (existing.status === "pending") {
    throw new Error("VAULT_REQUEST_REQUIRES_APPROVAL");
  }

  const request = await prisma.personalDataVaultRequest.update({
    where: { id: requestId },
    data: { status: "completed", completedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId,
    action: "data_vault.completed",
    entityType: "PersonalDataVaultRequest",
    entityId: requestId,
  });

  return request;
}

export async function listVaultRequestsForUser(userId: string) {
  return prisma.personalDataVaultRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function listAllVaultRequests() {
  return prisma.personalDataVaultRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
