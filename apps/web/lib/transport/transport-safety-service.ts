import type { TransportSafetyEventSeverity } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { phase4Config } from "@/lib/config/phase4";
import { createIncident } from "@/lib/incidents/incident-service";
import { prisma } from "@/lib/prisma";
import {
  assertAssignedDriver,
  assertCanAccessTrip,
} from "@/lib/transport/transport-access-policy";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { recordTripEvent } from "@/lib/transport/transport-event-service";

export async function reportTripSafetyIssue(
  user: CurrentUser,
  tripId: string,
  input: {
    category: string;
    description: string;
    severity: TransportSafetyEventSeverity;
    escalateToIncident?: boolean;
  }
) {
  const trip = await prisma.transportTrip.findUnique({ where: { id: tripId } });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  try {
    await assertAssignedDriver(user, tripId);
  } catch {
    await assertCanAccessTrip(user, trip, "summary");
  }

  const safetyEvent = await prisma.transportSafetyEvent.create({
    data: {
      tripId,
      category: input.category,
      description: input.description,
      severity: input.severity,
      reportedByUserId: user.id,
      escalated: Boolean(input.escalateToIncident),
    },
  });

  let incidentReportId: string | undefined;
  if (input.escalateToIncident && phase4Config.incidentReportingEnabled) {
    const incident = await createIncident({
      category: "unsafe_transport",
      severity:
        input.severity === "critical" || input.severity === "high"
          ? "high"
          : "medium",
      title: `Transport safety: ${input.category}`,
      description: input.description,
      participantId: trip.participantId,
      organisationId: trip.providerOrganisationId ?? undefined,
      reportedById: user.id,
      safeguardingConcern: input.severity === "critical",
    });
    incidentReportId = incident.id;
    await prisma.transportIncidentLink.create({
      data: {
        tripId,
        safetyEventId: safetyEvent.id,
        incidentReportId: incident.id,
      },
    });
  }

  await recordTripEvent({
    tripId,
    actorUserId: user.id,
    eventType: "safety_reported",
    message: input.category,
    metadata: { safetyEventId: safetyEvent.id, incidentReportId },
    participantId: trip.participantId,
    organisationId: trip.providerOrganisationId ?? undefined,
  });

  return { safetyEvent, incidentReportId };
}
