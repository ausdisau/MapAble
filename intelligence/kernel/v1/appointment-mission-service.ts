import { randomUUID } from "node:crypto";

import type { CurrentUser } from "@/lib/auth/current-user";
import { getPlaceById } from "@/lib/access-map/access-place-service";

import { buildCareSupportIntelligence } from "../../care/support-intelligence-service";
import { evaluateAppointmentAuthority } from "./authority";
import { reduceAppointmentMission } from "./event-reducer";
import type {
  AppointmentEvent,
  AppointmentMissionRequest,
  AppointmentMissionState,
} from "./appointment-types";

function event(params: Omit<AppointmentEvent, "id" | "occurredAt">): AppointmentEvent {
  return {
    ...params,
    id: randomUUID(),
    occurredAt: new Date().toISOString(),
  };
}

function dependency(
  id: string,
  label: string,
  status: AppointmentMissionState["dependencies"][number]["status"] = "unknown",
  evidence: string[] = [],
) {
  return { id, label, status, evidence };
}

export async function buildAppointmentMission(params: {
  user: CurrentUser;
  request: AppointmentMissionRequest;
}): Promise<AppointmentMissionState> {
  const missionId = randomUUID();
  const authority = evaluateAppointmentAuthority({
    participantId: params.user.id,
    request: params.request,
  });

  let state: AppointmentMissionState = {
    missionId,
    participantId: params.user.id,
    outcome: params.request.outcome,
    phase: "draft",
    authority,
    dependencies: [
      dependency("appointment", "Appointment", "confirmed", ["participant_input"]),
      dependency("support_intelligence", "Participant support brief"),
      dependency("care", "Care request", params.request.care.required ? "unknown" : "confirmed"),
      dependency("transport", "Accessible transport", params.request.transport.required ? "unknown" : "confirmed"),
      dependency("access", "Destination access evidence"),
      dependency("provider", "Provider capacity evidence"),
      dependency("worker", "Worker capability evidence"),
      dependency("human_review", "Human review", authority.decision === "human_review_required" ? "attention" : "confirmed"),
      dependency("outcome", "Outcome evidence"),
    ],
    pendingConfirmations: [],
    humanReviewRequired: authority.decision === "human_review_required",
    receipts: [],
    outcomeEvidence: [],
    events: [],
  };

  state = reduceAppointmentMission(
    state,
    event({
      missionId,
      participantId: params.user.id,
      type: "mission_created",
      source: "participant",
      severity: "information",
      summary: `Appointment mission created for ${params.request.appointment.title}.`,
      entityId: null,
      payload: {
        appointment: params.request.appointment,
        careRequired: params.request.care.required,
        transportRequired: params.request.transport.required,
      },
    }),
  );

  state = reduceAppointmentMission(
    state,
    event({
      missionId,
      participantId: params.user.id,
      type: "authority_evaluated",
      source: "careos",
      severity: authority.decision === "allow" ? "information" : "attention",
      summary: `Participant authority evaluated: ${authority.decision}.`,
      entityId: null,
      payload: { authority },
    }),
  );

  const support = await buildCareSupportIntelligence({
    user: params.user,
    request: {
      goal: params.request.outcome,
      supportContext: "health",
      desiredStartAt: params.request.appointment.startAt,
      durationMinutes: durationMinutes(params.request),
      supportTypes: params.request.care.supportTypes,
      communicationPreferences: params.request.care.communicationPreferences,
      accessRequirements: params.request.care.accessRequirements,
      region: null,
      linkedTransportRequired: params.request.transport.required,
      highIntensitySupportRequested: params.request.care.highIntensitySupport,
      backupPreference: params.request.care.backupPreference,
      includeExistingRecords: params.request.authority.includeExistingRecords,
    },
  });

  state = reduceAppointmentMission(
    state,
    event({
      missionId,
      participantId: params.user.id,
      type: "support_intelligence_generated",
      source: "careos",
      severity: support.readiness === "ready_for_participant_review" ? "information" : "attention",
      summary: `Support intelligence generated: ${support.readiness}.`,
      entityId: null,
      payload: {
        readiness: support.readiness,
        decisionsRequired: support.decisionsRequired,
        supportBrief: support.supportBrief,
        evidenceSummary: support.evidenceSummary,
      },
    }),
  );

  state = reduceAppointmentMission(
    state,
    event({
      missionId,
      participantId: params.user.id,
      type: "provider_evidence_read",
      source: "provider",
      severity:
        support.evidenceSummary.providerRecordsWithCapacity > 0 ? "information" : "attention",
      summary: `${support.evidenceSummary.matchingProviderRecords} matching provider record(s) reviewed without ranking or assignment.`,
      entityId: null,
      payload: { evidenceSummary: support.evidenceSummary },
    }),
  );

  state = reduceAppointmentMission(
    state,
    event({
      missionId,
      participantId: params.user.id,
      type: "worker_evidence_read",
      source: "worker",
      severity:
        support.evidenceSummary.verifiedWorkersWithAvailability > 0 ? "information" : "attention",
      summary: `${support.evidenceSummary.verifiedWorkerRecords} verified worker record(s) reviewed without ranking or assignment.`,
      entityId: null,
      payload: { evidenceSummary: support.evidenceSummary },
    }),
  );

  const place = params.request.appointment.accessPlaceId
    ? await getPlaceById(params.request.appointment.accessPlaceId)
    : null;

  state = reduceAppointmentMission(
    state,
    event({
      missionId,
      participantId: params.user.id,
      type: "access_evidence_read",
      source: "access",
      severity: place ? "information" : "attention",
      summary: place
        ? `Published access evidence reviewed for ${place.name}.`
        : "No published destination access record was selected; access remains unknown.",
      entityId: place?.id ?? null,
      payload: place
        ? {
            name: place.name,
            confidence: place.confidence,
            featureCount: place.features.length,
            reviewCount: place._count.reviews,
          }
        : {},
    }),
  );

  if (params.request.care.required && authority.permittedActions.includes("draft_care_request")) {
    state = reduceAppointmentMission(
      state,
      event({
        missionId,
        participantId: params.user.id,
        type: "care_action_prepared",
        source: "care",
        severity: "information",
        summary: "A care request draft is ready for participant review and confirmation.",
        entityId: null,
        payload: { supportBrief: support.supportBrief },
      }),
    );
  }

  if (
    params.request.transport.required &&
    authority.permittedActions.includes("draft_transport_request")
  ) {
    state = reduceAppointmentMission(
      state,
      event({
        missionId,
        participantId: params.user.id,
        type: "transport_action_prepared",
        source: "transport",
        severity: "information",
        summary: "An accessible transport request draft is ready for participant review and confirmation.",
        entityId: null,
        payload: {
          pickupAddress: params.request.transport.pickupAddress,
          destination: params.request.appointment.location,
          appointmentStartAt: params.request.appointment.startAt,
          vehicleRequirements: params.request.transport.vehicleRequirements,
        },
      }),
    );
  }

  if (authority.decision === "human_review_required") {
    state = reduceAppointmentMission(
      state,
      event({
        missionId,
        participantId: params.user.id,
        type: "human_review_created",
        source: "human_review",
        severity: "attention",
        summary: "Qualified human review is required before this mission can proceed.",
        entityId: null,
        payload: { reasons: authority.reasons },
      }),
    );
  }

  return state;
}

function durationMinutes(request: AppointmentMissionRequest): number | null {
  if (!request.appointment.endAt) return null;
  const start = new Date(request.appointment.startAt).getTime();
  const end = new Date(request.appointment.endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.round((end - start) / 60_000);
}
