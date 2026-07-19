import { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { y2OrchestrationConfig } from "@/lib/config/y2-orchestration";
import { recordMicroConsentGrant } from "@/lib/consent/micro-consent-service";
import { prisma } from "@/lib/prisma";
import { hasActiveConsentForCoordinator } from "@/lib/support-coordinator/consent-gate";

export async function requestCoordinatorAccess(params: {
  participantId: string;
  coordinatorId: string;
  scopes: string[];
}) {
  return prisma.coordinatorAccessRequest.create({
    data: {
      participantId: params.participantId,
      coordinatorId: params.coordinatorId,
      scopesJson: params.scopes,
      status: "pending",
    },
  });
}

export async function approveCoordinatorAccess(
  requestId: string,
  participantId: string
) {
  const req = await prisma.coordinatorAccessRequest.findUnique({
    where: { id: requestId },
  });
  if (!req || req.participantId !== participantId) throw new Error("FORBIDDEN");

  if (y2OrchestrationConfig.supportCoordinatorPortalEnabled) {
    await recordMicroConsentGrant({
      action: "coordinator.participant_access",
      subjectUserId: participantId,
      createdById: participantId,
      purpose: "Share support information with coordinator",
      grantedToUserId: req.coordinatorId,
      shareMode: "always_for_service",
    });
  }

  await prisma.coordinatorAccessRequest.update({
    where: { id: requestId },
    data: { status: "approved" },
  });

  const rel = await prisma.supportCoordinatorRelationship.upsert({
    where: {
      participantId_coordinatorId: {
        participantId: req.participantId,
        coordinatorId: req.coordinatorId,
      },
    },
    create: {
      participantId: req.participantId,
      coordinatorId: req.coordinatorId,
      status: "active",
      scopesJson: req.scopesJson as Prisma.InputJsonValue,
    },
    update: {
      status: "active",
      scopesJson: req.scopesJson as Prisma.InputJsonValue,
    },
  });

  await createAuditEvent({
    actorUserId: participantId,
    action: "coordinator.access_approved",
    entityType: "SupportCoordinatorRelationship",
    entityId: rel.id,
    participantId,
  });

  return rel;
}

export async function getCoordinatorParticipantSummary(
  coordinatorId: string,
  participantId: string
) {
  const allowed = await hasActiveConsentForCoordinator(
    participantId,
    coordinatorId
  );
  if (!allowed) throw new Error("CONSENT_REQUIRED");

  const summary = await prisma.participantSupportPlanSummary.findUnique({
    where: { participantId },
  });

  const bookings = await prisma.booking.count({
    where: { participantId, status: { not: "draft" } },
  });

  return {
    participantId,
    planSummary: summary?.summaryJson ?? {},
    openBookings: bookings,
    note: "Authorised summary only — sensitive notes excluded.",
  };
}

export async function listCoordinatorParticipants(coordinatorId: string) {
  const rels = await prisma.supportCoordinatorRelationship.findMany({
    where: { coordinatorId, status: "active" },
  });

  const participants = [];
  for (const rel of rels) {
    const allowed = await hasActiveConsentForCoordinator(
      rel.participantId,
      coordinatorId
    );
    if (!allowed) continue;
    const profile = await prisma.participantProfile.findUnique({
      where: { userId: rel.participantId },
      select: { displayName: true, preferredName: true },
    });
    participants.push({
      participantId: rel.participantId,
      displayName: profile?.preferredName ?? profile?.displayName ?? "Participant",
    });
  }
  return participants;
}

export async function listCoordinatorTasks(coordinatorId: string) {
  const participantIds = (
    await prisma.supportCoordinatorRelationship.findMany({
      where: { coordinatorId, status: "active" },
      select: { participantId: true },
    })
  ).map((r) => r.participantId);

  const [incidents, recoveries, rescheduleRequests, pendingAccess] =
    await Promise.all([
      prisma.incidentReport.findMany({
        where: {
          participantId: { in: participantIds },
          status: { notIn: ["closed", "resolved"] },
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      }),
      prisma.backupShiftRecovery.findMany({
        where: {
          participantId: { in: participantIds },
          status: { in: ["detected", "awaiting_participant", "escalated"] },
        },
        take: 10,
      }),
      prisma.orchestrationRescheduleRequest.findMany({
        where: { status: "pending" },
        take: 10,
        orderBy: { createdAt: "desc" },
      }),
      prisma.coordinatorAccessRequest.findMany({
        where: { coordinatorId, status: "pending" },
        take: 10,
      }),
    ]);

  return {
    incidents,
    recoveries,
    rescheduleRequests,
    pendingAccessRequests: pendingAccess,
  };
}

export async function getCoordinatorParticipantTimeline(
  coordinatorId: string,
  participantId: string
) {
  await getCoordinatorParticipantSummary(coordinatorId, participantId);

  const [careShifts, transportBookings, orchestrationState] = await Promise.all([
    prisma.careShift.findMany({
      where: { participantId },
      orderBy: { startAt: "desc" },
      take: 10,
      select: {
        id: true,
        status: true,
        startAt: true,
        endAt: true,
      },
    }),
    prisma.transportBooking.findMany({
      where: { participantId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, status: true, pickupWindowStart: true },
    }),
    prisma.careRequest.findFirst({
      where: { participantId, linkedTransportRequired: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  let linkedTransport = null;
  if (orchestrationState) {
    const { getUnifiedCareTransportState } = await import(
      "@/lib/orchestration/care-transport-orchestrator"
    );
    linkedTransport = await getUnifiedCareTransportState(orchestrationState.id);
  }

  return { careShifts, transportBookings, linkedTransport };
}
