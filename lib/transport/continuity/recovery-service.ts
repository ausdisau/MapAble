import type {
  TransportContinuityTrigger,
  TransportDisruptionKind,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { transportCommandConfig } from "@/lib/config/transport-command";
import { prisma } from "@/lib/prisma";
import { assessVehicleCompatibility } from "@/lib/transport/accessibility/evidence-service";
import { parseMobilityRequirements } from "@/lib/transport/mobility-schema";
import { TransportApiError } from "@/lib/transport/transport-api-error";
import { recordTripEvent } from "@/lib/transport/transport-event-service";

const RECOVERY_EXPIRY_HOURS = 4;

export type RecoveryOptionDraft = {
  optionKey: string;
  label: string;
  description: string;
  vehicleId?: string;
  driverId?: string;
  providerOrganisationId?: string;
  isLiveData?: boolean;
  nonLiveAlternative?: boolean;
  evidenceSummary?: string;
  sortOrder?: number;
};

function triggerToDisruptionKind(
  trigger: TransportContinuityTrigger
): TransportDisruptionKind {
  switch (trigger) {
    case "driver_cancel":
    case "vehicle_failure":
    case "late_pickup":
      return "route_disruption";
    case "route_disruption":
      return "route_disruption";
    case "lift_outage":
      return "lift_outage";
    case "appointment_change":
      return "appointment_change";
    case "missing_return_trip":
      return "missing_return_trip";
    default: {
      const _exhaustive: never = trigger;
      return _exhaustive;
    }
  }
}

export async function proposeRecoveryOptions(params: {
  tripId: string;
  trigger: TransportContinuityTrigger;
  actorUserId: string;
  optionDrafts: RecoveryOptionDraft[];
}) {
  if (!transportCommandConfig.continuityRecoveryEnabled) {
    throw new TransportApiError("TRANSPORT_CONTINUITY_DISABLED");
  }
  if (transportCommandConfig.autoSubstitutionEnabled) {
    throw new TransportApiError("TRANSPORT_AUTO_SUBSTITUTION_FORBIDDEN");
  }

  const trip = await prisma.transportTrip.findUnique({
    where: { id: params.tripId },
    include: {
      dispatchAssignments: { where: { active: true }, take: 1 },
    },
  });
  if (!trip) throw new TransportApiError("TRANSPORT_TRIP_NOT_FOUND");

  const expiresAt = new Date(Date.now() + RECOVERY_EXPIRY_HOURS * 60 * 60 * 1000);
  const mobility = parseMobilityRequirements(trip.mobilityRequirements);

  const validatedOptions: RecoveryOptionDraft[] = [];
  for (const draft of params.optionDrafts) {
    if (draft.vehicleId) {
      const compatibility = await assessVehicleCompatibility(
        draft.vehicleId,
        mobility
      );
      if (!compatibility.compatible) {
        continue;
      }
      draft.evidenceSummary = compatibility.evidenceSources.join(", ");
    }
    validatedOptions.push({
      ...draft,
      nonLiveAlternative: draft.isLiveData ? true : (draft.nonLiveAlternative ?? true),
    });
  }

  if (validatedOptions.length === 0) {
    const request = await prisma.transportContinuityRecoveryRequest.create({
      data: {
        tripId: params.tripId,
        participantId: trip.participantId,
        trigger: params.trigger,
        status: "escalated",
        requiresConfirmation: true,
        expiresAt,
        notes: "No evidence-compliant recovery options available",
      },
    });

    await createDisruptionEvent({
      tripId: params.tripId,
      participantId: trip.participantId,
      kind: triggerToDisruptionKind(params.trigger),
      source: "continuity_recovery",
      title: `Recovery escalated: ${params.trigger.replace(/_/g, " ")}`,
      description: "No compliant alternatives — human review required",
    });

    return { request, options: [], escalated: true };
  }

  const request = await prisma.transportContinuityRecoveryRequest.create({
    data: {
      tripId: params.tripId,
      participantId: trip.participantId,
      trigger: params.trigger,
      status: "awaiting_confirmation",
      requiresConfirmation: true,
      expiresAt,
      options: {
        create: validatedOptions.map((opt, index) => ({
          optionKey: opt.optionKey,
          label: opt.label,
          description: opt.description,
          vehicleId: opt.vehicleId,
          driverId: opt.driverId,
          providerOrganisationId: opt.providerOrganisationId,
          isLiveData: opt.isLiveData ?? false,
          nonLiveAlternative: opt.nonLiveAlternative ?? true,
          evidenceSummary: opt.evidenceSummary,
          sortOrder: opt.sortOrder ?? index,
        })),
      },
    },
    include: { options: { orderBy: { sortOrder: "asc" } } },
  });

  await createDisruptionEvent({
    tripId: params.tripId,
    participantId: trip.participantId,
    kind: triggerToDisruptionKind(params.trigger),
    source: "continuity_recovery",
    title: `Recovery options for ${params.trigger.replace(/_/g, " ")}`,
    description: `${validatedOptions.length} option(s) awaiting participant confirmation`,
  });

  await recordTripEvent({
    tripId: params.tripId,
    actorUserId: params.actorUserId,
    eventType: "continuity_recovery_options_presented",
    message: "Recovery options presented — confirmation required before any change",
    participantId: trip.participantId,
    metadata: { requestId: request.id, trigger: params.trigger },
  });

  return { request, options: request.options, escalated: false };
}

export async function confirmRecoveryOption(params: {
  requestId: string;
  optionId: string;
  confirmedByUserId: string;
  participantId: string;
}) {
  if (!transportCommandConfig.continuityRecoveryEnabled) {
    throw new TransportApiError("TRANSPORT_CONTINUITY_DISABLED");
  }

  const request = await prisma.transportContinuityRecoveryRequest.findUnique({
    where: { id: params.requestId },
    include: { options: true, trip: true },
  });
  if (!request) throw new TransportApiError("TRANSPORT_RECOVERY_NOT_FOUND");
  if (request.participantId !== params.participantId) {
    throw new TransportApiError("TRANSPORT_PARTICIPANT_MISMATCH");
  }
  if (request.status === "confirmed") {
    throw new TransportApiError("TRANSPORT_RECOVERY_ALREADY_CONFIRMED");
  }
  if (request.expiresAt && request.expiresAt < new Date()) {
    await prisma.transportContinuityRecoveryRequest.update({
      where: { id: params.requestId },
      data: { status: "expired" },
    });
    throw new TransportApiError("TRANSPORT_RECOVERY_EXPIRED");
  }

  const option = request.options.find((o) => o.id === params.optionId);
  if (!option) throw new TransportApiError("TRANSPORT_RECOVERY_OPTION_NOT_FOUND");

  const updated = await prisma.transportContinuityRecoveryRequest.update({
    where: { id: params.requestId },
    data: {
      status: "confirmed",
      confirmedByUserId: params.confirmedByUserId,
      confirmedAt: new Date(),
    },
    include: { options: true },
  });

  await recordTripEvent({
    tripId: request.tripId,
    actorUserId: params.confirmedByUserId,
    eventType: "continuity_recovery_confirmed",
    message: `Recovery option confirmed: ${option.label}`,
    participantId: request.participantId,
    metadata: { optionId: option.id, optionKey: option.optionKey },
  });

  await createAuditEvent({
    actorUserId: params.confirmedByUserId,
    action: "transport.continuity_recovery_confirmed",
    entityType: "TransportContinuityRecoveryRequest",
    entityId: params.requestId,
  });

  return { request: updated, selectedOption: option };
}

export async function listOpenRecoveries(participantId?: string) {
  return prisma.transportContinuityRecoveryRequest.findMany({
    where: {
      status: { in: ["options_presented", "awaiting_confirmation"] },
      ...(participantId ? { participantId } : {}),
    },
    include: { options: { orderBy: { sortOrder: "asc" } }, trip: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function createDisruptionEvent(params: {
  tripId?: string;
  participantId?: string;
  kind: TransportDisruptionKind;
  source: string;
  title: string;
  description?: string;
  sourceFreshnessAt?: Date;
}) {
  if (!transportCommandConfig.commandCentreEnabled) return null;

  return prisma.transportDisruptionEvent.create({
    data: {
      tripId: params.tripId,
      participantId: params.participantId,
      kind: params.kind,
      source: params.source,
      sourceFreshnessAt: params.sourceFreshnessAt ?? new Date(),
      title: params.title,
      description: params.description,
    },
  });
}

export async function listOpenDisruptions(filters?: {
  participantId?: string;
  organisationId?: string;
}) {
  return prisma.transportDisruptionEvent.findMany({
    where: {
      status: { in: ["open", "acknowledged", "recovery_in_progress"] },
      ...(filters?.participantId ? { participantId: filters.participantId } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function acknowledgeDisruption(disruptionId: string, actorUserId: string) {
  const updated = await prisma.transportDisruptionEvent.update({
    where: { id: disruptionId },
    data: { status: "acknowledged", acknowledgedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId,
    action: "transport.disruption_acknowledged",
    entityType: "TransportDisruptionEvent",
    entityId: disruptionId,
  });

  return updated;
}
