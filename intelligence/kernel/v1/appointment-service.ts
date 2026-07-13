import { randomUUID } from "node:crypto";

import { listPublishedPlaces } from "@/lib/access-map/access-place-service";
import type { CurrentUser } from "@/lib/auth/current-user";

import { buildCareSupportIntelligence } from "../../care/support-intelligence-service";
import { evaluateAppointmentAuthority } from "./appointment-authority";
import { createAppointmentMissionState, reduceAppointmentEvent } from "./appointment-reducer";
import type { AppointmentEvent, AppointmentMissionRequest, AppointmentMissionState } from "./appointment-types";

function event(params: Omit<AppointmentEvent, "id" | "occurredAt">): AppointmentEvent {
  return { ...params, id: randomUUID(), occurredAt: new Date().toISOString() };
}

function dependency(
  id: string,
  label: string,
  status: "confirmed" | "attention" | "unknown" | "blocked",
  evidence: string[],
) {
  return { id, label, status, evidence };
}

export async function buildAppointmentMission(params: {
  user: CurrentUser;
  request: AppointmentMissionRequest;
}) {
  const missionId = randomUUID();
  const authority = evaluateAppointmentAuthority(params);
  let state = createAppointmentMissionState({
    missionId,
    participantId: params.user.id,
    outcome: params.request.outcome,
    authority,
  });

  state = reduceAppointmentEvent(state, event({
    missionId,
    participantId: params.user.id,
    type: "mission_created",
    source: "participant",
    severity: "information",
    summary: `Appointment mission created for ${params.request.appointment.title}.`,
    entityId: null,
    payload: { appointment: params.request.appointment },
  }));
  state = reduceAppointmentEvent(state, event({
    missionId,
    participantId: params.user.id,
    type: "authority_evaluated",
    source: "careos",
    severity: authority.decision === "human_review_required" ? "attention" : "information",
    summary: `Participant authority evaluated as ${authority.decision}.`,
    entityId: null,
    payload: { authority },
  }));

  const supportIntelligence = await buildCareSupportIntelligence({
    user: params.user,
    request: {
      goal: params.request.outcome,
      supportContext: "health",
      desiredStartAt: params.request.appointment.startAt,
      durationMinutes: params.request.appointment.endAt
        ? Math.max(15, Math.round((new Date(params.request.appointment.endAt).getTime() - new Date(params.request.appointment.startAt).getTime()) / 60_000))
        : 120,
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

  const accessPlaces = params.request.appointment.accessPlaceId
    ? await listPublishedPlaces(50)
    : [];
  const accessEvidence = accessPlaces.find(
    (place) => place.id === params.request.appointment.accessPlaceId,
  ) ?? null;

  const dependencies: AppointmentMissionState["dependencies"] = [
    dependency("appointment", "Appointment details", "confirmed", ["participant_input"]),
    dependency(
      "care",
      "Care and support coverage",
      params.request.care.required
        ? supportIntelligence.checks.some((check) => check.id === "worker_capability" && check.status === "confirmed")
          ? "attention"
          : "unknown"
        : "confirmed",
      supportIntelligence.checks.find((check) => check.id === "worker_capability")?.evidence ?? [],
    ),
    dependency(
      "transport",
      "Accessible transport",
      params.request.transport.required ? "attention" : "confirmed",
      params.request.transport.required ? ["participant_input"] : [],
    ),
    dependency(
      "access",
      "Destination access evidence",
      accessEvidence ? "confirmed" : "unknown",
      accessEvidence ? [`access_place:${accessEvidence.id}`] : [],
    ),
    dependency(
      "provider",
      "Provider capacity",
      supportIntelligence.evidenceSummary.providerRecordsWithCapacity > 0 ? "attention" : "unknown",
      supportIntelligence.providerEvidence.map((provider) => `provider:${provider.organisationId}`),
    ),
    dependency(
      "worker",
      "Worker capability and availability",
      supportIntelligence.evidenceSummary.verifiedWorkersWithAvailability > 0 ? "attention" : "unknown",
      supportIntelligence.workerEvidence.map((worker) => `worker:${worker.workerProfileId}`),
    ),
  ];

  state = reduceAppointmentEvent(state, event({
    missionId,
    participantId: params.user.id,
    type: "support_intelligence_generated",
    source: "careos",
    severity: supportIntelligence.readiness === "human_coordination_recommended" ? "attention" : "information",
    summary: "Participant-led support intelligence generated.",
    entityId: null,
    payload: { dependencies, readiness: supportIntelligence.readiness },
  }));
  if (accessEvidence) {
    state = reduceAppointmentEvent(state, event({
      missionId,
      participantId: params.user.id,
      type: "access_evidence_read",
      source: "access",
      severity: "information",
      summary: `Published access evidence read for ${accessEvidence.name}.`,
      entityId: accessEvidence.id,
      payload: { confidence: accessEvidence.confidence, featureCount: accessEvidence.features.length },
    }));
  }
  if (params.request.care.required) {
    state = reduceAppointmentEvent(state, event({
      missionId,
      participantId: params.user.id,
      type: "care_action_prepared",
      source: "careos",
      severity: "information",
      summary: "Care request handoff prepared for participant confirmation.",
      entityId: null,
      payload: {},
    }));
  }
  if (params.request.transport.required) {
    state = reduceAppointmentEvent(state, event({
      missionId,
      participantId: params.user.id,
      type: "transport_action_prepared",
      source: "careos",
      severity: "information",
      summary: "Transport request handoff prepared for participant confirmation.",
      entityId: null,
      payload: {},
    }));
  }
  if (authority.decision === "human_review_required" || supportIntelligence.readiness === "human_coordination_recommended") {
    state = reduceAppointmentEvent(state, event({
      missionId,
      participantId: params.user.id,
      type: "human_review_created",
      source: "human_review",
      severity: "attention",
      summary: "Qualified human coordination is required before service confirmation.",
      entityId: null,
      payload: { assignedRole: "support_coordinator" },
    }));
  }

  return {
    kernelVersion: "careos-kernel-v1",
    missionType: "attend_appointment",
    state,
    supportIntelligence,
    accessEvidence: accessEvidence
      ? { id: accessEvidence.id, name: accessEvidence.name, confidence: accessEvidence.confidence, features: accessEvidence.features }
      : null,
    handoffs: {
      care: params.request.care.required ? { endpoint: "/api/intelligence/careos-actions/prepare", actionType: "submit_care_request" } : null,
      transport: params.request.transport.required ? { endpoint: "/api/intelligence/careos-actions/prepare", actionType: "submit_transport_request" } : null,
      humanReview: state.humanReviewRequired ? { endpoint: "/api/intelligence/careos-reviews", assignedRole: "support_coordinator" } : null,
    },
    safeguards: [
      "No worker or provider has been assigned.",
      "No care or transport request has been submitted.",
      "Participant confirmation remains required for each consequential action.",
      "Unknown evidence remains labelled unknown.",
    ],
  };
}
