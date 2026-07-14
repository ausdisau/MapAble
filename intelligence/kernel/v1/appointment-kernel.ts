import { randomUUID } from "node:crypto";

import type { CurrentUser } from "@/lib/auth/current-user";

import { buildCareSupportIntelligence } from "../../care/support-intelligence-service";
import { evaluateAppointmentAuthority } from "./authority";
import type {
  AppointmentEvent,
  AppointmentMissionRequest,
  AppointmentMissionState,
} from "./appointment-types";
import { reduceAppointmentMission } from "./event-reducer";

function event(params: Omit<AppointmentEvent, "id" | "occurredAt">): AppointmentEvent {
  return {
    ...params,
    id: randomUUID(),
    occurredAt: new Date().toISOString(),
  };
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
    dependencies: buildDependencies(params.request),
    pendingConfirmations: [],
    humanReviewRequired: false,
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
      summary: "The participant created an appointment mission.",
      entityId: null,
      payload: { appointment: params.request.appointment },
    }),
  );

  state = reduceAppointmentMission(
    state,
    event({
      missionId,
      participantId: params.user.id,
      type: "authority_evaluated",
      source: "careos",
      severity:
        authority.decision === "human_review_required" ? "attention" : "information",
      summary: `Participant authority evaluated: ${authority.decision}.`,
      entityId: null,
      payload: { permittedReads: authority.permittedReads },
    }),
  );

  const supportIntelligence = await buildCareSupportIntelligence({
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
      severity:
        supportIntelligence.readiness === "ready_for_participant_review"
          ? "information"
          : "attention",
      summary: `Support intelligence prepared: ${supportIntelligence.readiness}.`,
      entityId: null,
      payload: {
        readiness: supportIntelligence.readiness,
        checks: supportIntelligence.checks,
        decisionsRequired: supportIntelligence.decisionsRequired,
      },
    }),
  );

  if (params.request.authority.allowProviderEvidenceRead) {
    state = reduceAppointmentMission(
      state,
      evidenceEvent({
        missionId,
        participantId: params.user.id,
        type: "provider_evidence_read",
        count: supportIntelligence.evidenceSummary.matchingProviderRecords,
      }),
    );
  }
  if (params.request.authority.allowWorkerEvidenceRead) {
    state = reduceAppointmentMission(
      state,
      evidenceEvent({
        missionId,
        participantId: params.user.id,
        type: "worker_evidence_read",
        count: supportIntelligence.evidenceSummary.matchingWorkerRecords,
      }),
    );
  }
  if (params.request.appointment.accessPlaceId) {
    state = reduceAppointmentMission(
      state,
      event({
        missionId,
        participantId: params.user.id,
        type: "access_evidence_read",
        source: "access",
        severity: "information",
        summary: "The selected accessibility place record is linked to the mission.",
        entityId: params.request.appointment.accessPlaceId,
        payload: {},
      }),
    );
  }

  if (params.request.care.required) {
    state = reduceAppointmentMission(
      state,
      preparedActionEvent(missionId, params.user.id, "care_action_prepared"),
    );
  }
  if (params.request.transport.required) {
    state = reduceAppointmentMission(
      state,
      preparedActionEvent(missionId, params.user.id, "transport_action_prepared"),
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
        summary: "Qualified human coordination is required before the mission can proceed.",
        entityId: null,
        payload: { reasons: authority.reasons },
      }),
    );
  }

  return state;
}

function buildDependencies(
  request: AppointmentMissionRequest,
): AppointmentMissionState["dependencies"] {
  return [
    {
      id: "appointment",
      label: request.appointment.title,
      status: "confirmed",
      evidence: ["participant_input"],
    },
    {
      id: "support_intelligence",
      label: "Participant-led support brief",
      status: "unknown",
      evidence: [],
    },
    {
      id: "care",
      label: "Care and support request",
      status: request.care.required ? "attention" : "confirmed",
      evidence: request.care.required ? [] : ["participant_not_required"],
    },
    {
      id: "transport",
      label: "Accessible transport request",
      status: request.transport.required ? "attention" : "confirmed",
      evidence: request.transport.required ? [] : ["participant_not_required"],
    },
    {
      id: "access",
      label: "Destination accessibility evidence",
      status: request.appointment.accessPlaceId ? "attention" : "unknown",
      evidence: [],
    },
    {
      id: "provider",
      label: "Provider capacity evidence",
      status: request.authority.allowProviderEvidenceRead ? "unknown" : "blocked",
      evidence: [],
    },
    {
      id: "worker",
      label: "Worker capability evidence",
      status: request.authority.allowWorkerEvidenceRead ? "unknown" : "blocked",
      evidence: [],
    },
  ];
}

function evidenceEvent(params: {
  missionId: string;
  participantId: string;
  type: "provider_evidence_read" | "worker_evidence_read";
  count: number;
}): AppointmentEvent {
  return event({
    missionId: params.missionId,
    participantId: params.participantId,
    type: params.type,
    source: params.type.startsWith("provider") ? "provider" : "worker",
    severity: params.count > 0 ? "information" : "attention",
    summary: `${params.count} matching evidence record${params.count === 1 ? "" : "s"} found. This is not an assignment or availability guarantee.`,
    entityId: null,
    payload: { count: params.count },
  });
}

function preparedActionEvent(
  missionId: string,
  participantId: string,
  type: "care_action_prepared" | "transport_action_prepared",
): AppointmentEvent {
  return event({
    missionId,
    participantId,
    type,
    source: type.startsWith("care") ? "care" : "transport",
    severity: "information",
    summary: "A draft action is ready for participant review. Nothing has been submitted.",
    entityId: null,
    payload: { executionRequiresExplicitConfirmation: true },
  });
}

function durationMinutes(request: AppointmentMissionRequest): number {
  if (!request.appointment.endAt) return 120;
  const start = new Date(request.appointment.startAt).getTime();
  const end = new Date(request.appointment.endAt).getTime();
  return Math.max(15, Math.min(1440, Math.round((end - start) / 60_000)));
}
