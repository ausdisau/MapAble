import type { MapAbleUserRole } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isAdminRole } from "@/lib/auth/roles";
import { identityAuthorityConfig } from "@/lib/config/identity-authority";
import { prisma } from "@/lib/prisma";

export async function requestEmergencyAccess(input: {
  participantId: string;
  requesterId: string;
  purpose: string;
  justification: string;
  requestedScopes: string[];
  expiresAt?: Date;
}) {
  if (!identityAuthorityConfig.emergencyAccessEnabled) {
    throw new Error("EMERGENCY_ACCESS_DISABLED");
  }
  if (!input.justification.trim() || input.justification.length < 20) {
    throw new Error("EMERGENCY_JUSTIFICATION_REQUIRED");
  }

  const request = await prisma.emergencyAccessRequest.create({
    data: {
      participantId: input.participantId,
      requesterId: input.requesterId,
      purpose: input.purpose,
      justification: input.justification,
      requestedScopes: input.requestedScopes,
      expiresAt: input.expiresAt,
      status: "requested",
    },
  });

  await createAuditEvent({
    actorUserId: input.requesterId,
    participantId: input.participantId,
    action: "emergency_access.requested",
    entityType: "EmergencyAccessRequest",
    entityId: request.id,
    metadata: { purpose: input.purpose, scopes: input.requestedScopes },
  });

  return request;
}

export async function reviewEmergencyAccess(input: {
  requestId: string;
  reviewerId: string;
  reviewerRole: MapAbleUserRole;
  decision: "approve" | "deny";
  notes?: string;
  approvedExpiresAt?: Date;
}) {
  if (!identityAuthorityConfig.emergencyAccessEnabled) {
    throw new Error("EMERGENCY_ACCESS_DISABLED");
  }
  if (!isAdminRole(input.reviewerRole)) {
    throw new Error("EMERGENCY_REVIEW_REQUIRES_HUMAN_ADMIN");
  }

  const request = await prisma.emergencyAccessRequest.findUnique({
    where: { id: input.requestId },
  });
  if (!request) throw new Error("EMERGENCY_ACCESS_NOT_FOUND");
  if (request.status !== "requested" && request.status !== "under_review") {
    throw new Error("EMERGENCY_ACCESS_NOT_REVIEWABLE");
  }

  const review = await prisma.emergencyAccessReview.create({
    data: {
      requestId: input.requestId,
      reviewerId: input.reviewerId,
      decision: input.decision,
      notes: input.notes,
    },
  });

  const updated = await prisma.emergencyAccessRequest.update({
    where: { id: input.requestId },
    data: {
      status: input.decision === "approve" ? "approved" : "denied",
      expiresAt:
        input.decision === "approve"
          ? (input.approvedExpiresAt ?? new Date(Date.now() + 4 * 60 * 60_000))
          : request.expiresAt,
    },
  });

  await createAuditEvent({
    actorUserId: input.reviewerId,
    participantId: request.participantId,
    action: `emergency_access.${input.decision}`,
    entityType: "EmergencyAccessRequest",
    entityId: request.id,
    metadata: { reviewId: review.id },
  });

  return { request: updated, review };
}

export async function hasApprovedEmergencyAccess(input: {
  participantId: string;
  requesterId: string;
  scope: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const request = await prisma.emergencyAccessRequest.findFirst({
    where: {
      participantId: input.participantId,
      requesterId: input.requesterId,
      status: "approved",
      requestedScopes: { has: input.scope },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  return Boolean(request);
}

export async function listEmergencyAccessRequests(participantId: string) {
  return prisma.emergencyAccessRequest.findMany({
    where: { participantId },
    include: { reviews: true },
    orderBy: { createdAt: "desc" },
  });
}
