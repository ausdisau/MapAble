import type { CareRequestType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { syncCalendarForCareRequest } from "@/lib/calendar/calendar-service";
import { phase4Config } from "@/lib/config/phase4";
import { platformPatternsConfig } from "@/lib/config/platform-patterns";
import { checkConsent } from "@/lib/consent/consent-service";
import { notifyUser } from "@/lib/notifications/notification-service";
import { assertProviderReadyToServe } from "@/lib/onboarding/provider-service-ready";
import { prisma } from "@/lib/prisma";

export async function createCareRequest(params: {
  participantId: string;
  createdById: string;
  requestType: CareRequestType;
  title: string;
  description: string;
  preferredDate?: Date;
  startTime?: string;
  endTime?: string;
  address?: string;
  suburb?: string;
  state?: string;
  accessRequirementsSummary?: string;
  linkedTransportRequired?: boolean;
  shareAccessibility?: boolean;
  shareAccessibilityConfirmed?: boolean;
  fundingSourceId?: string;
  tasks?: unknown[];
}) {
  if (
    params.shareAccessibility &&
    params.shareAccessibilityConfirmed &&
    params.accessRequirementsSummary
  ) {
    const hasConsent = await checkConsent({
      subjectUserId: params.participantId,
      scope: "care.accessibility_share",
    });
    if (!hasConsent) {
      throw new Error("CONSENT_REQUIRED");
    }
  }

  const request = await prisma.careRequest.create({
    data: {
      participantId: params.participantId,
      createdById: params.createdById,
      requestType: params.requestType,
      title: params.title,
      description: params.description,
      preferredDate: params.preferredDate,
      startTime: params.startTime,
      endTime: params.endTime,
      address: params.address,
      suburb: params.suburb,
      state: params.state,
      accessRequirementsSummary: params.shareAccessibility
        ? params.accessRequirementsSummary
        : undefined,
      linkedTransportRequired: params.linkedTransportRequired ?? false,
      shareAccessibility: params.shareAccessibility ?? false,
      fundingSourceId: params.fundingSourceId,
      tasks: (params.tasks ?? []) as object,
      status: "draft",
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "care_request.created",
    entityType: "CareRequest",
    entityId: request.id,
    participantId: params.participantId,
  });

  return request;
}

export type CareRequestSubmitResult = {
  request: Awaited<ReturnType<typeof prisma.careRequest.update>>;
  matchingSkipped?: boolean;
  matchingError?: string;
  redirectTo?: string;
};

export async function submitCareRequest(
  careRequestId: string,
  actorUserId: string
): Promise<CareRequestSubmitResult> {
  const request = await prisma.careRequest.update({
    where: { id: careRequestId },
    data: { status: "submitted" },
  });

  await syncCalendarForCareRequest(request);
  await createAuditEvent({
    actorUserId,
    action: "care_request.submitted",
    entityType: "CareRequest",
    entityId: request.id,
    participantId: request.participantId,
  });

  const admins = await prisma.user.findMany({
    where: { primaryRole: "mapable_admin" },
    select: { id: true },
  });
  for (const a of admins) {
    await notifyUser(a.id, "booking", "Care request submitted", request.title);
  }

  let matchingSkipped = false;
  let matchingError: string | undefined;
  let redirectTo = "/care/bookings";

  if (phase4Config.matchingEngineEnabled) {
    try {
      const { runCareWorkerMatch } = await import("@/lib/matching/matching-service");
      const result = await runCareWorkerMatch(careRequestId, actorUserId);
      if (result && "skipped" in result && result.skipped) {
        matchingSkipped = true;
      } else {
        redirectTo = `/dashboard/care/matches/${careRequestId}`;
      }
    } catch (e) {
      if (
        platformPatternsConfig.onboardingGateEnabled &&
        e instanceof Error &&
        e.message === "ONBOARDING_NOT_READY"
      ) {
        matchingSkipped = true;
        matchingError = "ONBOARDING_NOT_READY";
      } else {
        matchingSkipped = true;
        matchingError = e instanceof Error ? e.message : "MATCHING_FAILED";
      }
    }
  }

  return {
    request,
    matchingSkipped,
    matchingError,
    redirectTo,
  };
}

export async function assignCareRequestProvider(
  careRequestId: string,
  organisationId: string,
  adminUserId: string
) {
  await assertProviderReadyToServe(organisationId);

  const request = await prisma.careRequest.update({
    where: { id: careRequestId },
    data: {
      assignedOrganisationId: organisationId,
      status: "awaiting_provider_response",
    },
  });

  await createAuditEvent({
    actorUserId: adminUserId,
    action: "care_request.assigned",
    entityType: "CareRequest",
    entityId: careRequestId,
    organisationId,
    participantId: request.participantId,
  });

  const existingBooking = await prisma.careBooking.findUnique({
    where: { careRequestId },
  });
  if (!existingBooking) {
    await prisma.careBooking.create({
      data: {
        careRequestId,
        participantId: request.participantId,
        organisationId,
        status: "pending_provider",
        tasks: request.tasks ?? [],
        location: request.address ?? undefined,
        scheduledStartAt: request.preferredDate ?? undefined,
      },
    });
  }

  return request;
}

export async function providerAcceptCareRequest(
  careRequestId: string,
  actorUserId: string,
  actorOrganisationIds?: string[]
) {
  const existing = await prisma.careRequest.findUnique({
    where: { id: careRequestId },
  });
  if (!existing) throw new Error("NOT_FOUND");
  if (
    existing.assignedOrganisationId &&
    actorOrganisationIds &&
    !actorOrganisationIds.includes(existing.assignedOrganisationId)
  ) {
    throw new Error("ORG_ACCESS_DENIED");
  }

  const request = await prisma.careRequest.update({
    where: { id: careRequestId },
    data: { status: "confirmed" },
  });

  if (existing.assignedOrganisationId) {
    const { createCareBookingFromRequest } = await import(
      "@/lib/care/care-booking-service"
    );
    await createCareBookingFromRequest({
      careRequestId,
      organisationId: existing.assignedOrganisationId,
      actorUserId,
    });
  }

  await createAuditEvent({
    actorUserId,
    action: "care_request.provider_accepted",
    entityType: "CareRequest",
    entityId: careRequestId,
    participantId: request.participantId,
    organisationId: existing.assignedOrganisationId ?? undefined,
  });

  if (request.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: request.bookingId,
      eventType: "provider_accepted",
      title: "Care provider accepted request",
      actorUserId,
    });
  }

  await notifyUser(
    request.participantId,
    "booking",
    "Care request confirmed",
    "Your care provider has accepted your request."
  );

  return request;
}
