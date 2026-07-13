import { describe, expect, it } from "vitest";

import { evaluateAppointmentAuthority } from "@/intelligence/kernel/v1/authority";
import type {
  AppointmentEvent,
  AppointmentMissionRequest,
  AppointmentMissionState,
} from "@/intelligence/kernel/v1/appointment-types";
import { reduceAppointmentMission } from "@/intelligence/kernel/v1/event-reducer";

const request: AppointmentMissionRequest = {
  outcome: "Attend my appointment with reliable support.",
  appointment: {
    title: "Specialist appointment",
    startAt: "2026-07-20T00:00:00.000Z",
    endAt: "2026-07-20T02:00:00.000Z",
    location: "Sydney Clinic",
    accessPlaceId: null,
  },
  care: {
    required: true,
    supportTypes: ["Appointment support"],
    communicationPreferences: ["Ask me directly"],
    accessRequirements: ["Power wheelchair clearance"],
    highIntensitySupport: false,
    backupPreference: "participant_selects_each_time",
  },
  transport: {
    required: true,
    pickupAddress: "St Ives NSW",
    returnTripRequired: true,
    vehicleRequirements: ["Power wheelchair accessible"],
  },
  authority: {
    includeExistingRecords: true,
    includeAccessibilityProfile: false,
    allowProviderEvidenceRead: true,
    allowWorkerEvidenceRead: true,
    allowHumanReview: true,
  },
};

function baseState(): AppointmentMissionState {
  return {
    missionId: "mission-1",
    participantId: "participant-1",
    outcome: request.outcome,
    phase: "draft",
    authority: evaluateAppointmentAuthority({
      participantId: "participant-1",
      request,
    }),
    dependencies: [
      { id: "appointment", label: "Appointment", status: "confirmed", evidence: [] },
      { id: "care", label: "Care", status: "attention", evidence: [] },
      { id: "transport", label: "Transport", status: "attention", evidence: [] },
    ],
    pendingConfirmations: [],
    humanReviewRequired: false,
    receipts: [],
    outcomeEvidence: [],
    events: [],
  };
}

function event(
  type: AppointmentEvent["type"],
  overrides: Partial<AppointmentEvent> = {},
): AppointmentEvent {
  return {
    id: `event-${type}`,
    missionId: "mission-1",
    participantId: "participant-1",
    type,
    source: "careos",
    severity: "information",
    occurredAt: "2026-07-13T00:00:00.000Z",
    summary: type,
    entityId: null,
    payload: {},
    ...overrides,
  };
}

describe("CareOS Kernel v1 appointment mission", () => {
  it("keeps consequential actions prohibited while allowing draft handoffs", () => {
    const authority = evaluateAppointmentAuthority({
      participantId: "participant-1",
      request,
    });

    expect(authority.decision).toBe("allow");
    expect(authority.permittedActions).toContain("draft_care_request");
    expect(authority.permittedActions).toContain("draft_transport_request");
    expect(authority.prohibitedActions).toContain("assign_worker_or_provider");
    expect(authority.prohibitedActions).toContain("approve_payment_or_claim");
  });

  it("requires human review for high-intensity support", () => {
    const authority = evaluateAppointmentAuthority({
      participantId: "participant-1",
      request: {
        ...request,
        care: { ...request.care, highIntensitySupport: true },
      },
    });

    expect(authority.decision).toBe("human_review_required");
    expect(authority.reasons.join(" ")).toContain("High-intensity support");
  });

  it("tracks prepared actions as participant confirmations", () => {
    let state = baseState();
    state = reduceAppointmentMission(state, event("care_action_prepared"));
    state = reduceAppointmentMission(state, event("transport_action_prepared"));

    expect(state.phase).toBe("awaiting_participant");
    expect(state.pendingConfirmations).toEqual(["care", "transport"]);
  });

  it("records receipts and updates dependencies after explicit confirmation", () => {
    let state = baseState();
    state = reduceAppointmentMission(state, event("care_action_prepared"));
    state = reduceAppointmentMission(
      state,
      event("care_action_confirmed", {
        source: "care",
        entityId: "care-request-1",
        payload: { receiptId: "receipt-1", entityType: "CareRequest" },
      }),
    );

    expect(state.pendingConfirmations).not.toContain("care");
    expect(state.dependencies.find((item) => item.id === "care")?.status).toBe(
      "confirmed",
    );
    expect(state.receipts).toContainEqual({
      actionType: "care_action_confirmed",
      entityType: "CareRequest",
      entityId: "care-request-1",
      receiptId: "receipt-1",
    });
  });

  it("routes urgent continuity events to human review without executing recovery", () => {
    const state = reduceAppointmentMission(
      baseState(),
      event("continuity_alerted", {
        severity: "urgent",
        source: "careos",
        summary: "Worker cancellation affects the appointment mission.",
      }),
    );

    expect(state.phase).toBe("awaiting_human_review");
    expect(state.humanReviewRequired).toBe(true);
    expect(state.receipts).toHaveLength(0);
  });

  it("completes only after outcome evidence is recorded", () => {
    let state = baseState();
    state = reduceAppointmentMission(
      state,
      event("outcome_recorded", {
        source: "participant",
        entityId: "outcome-1",
      }),
    );

    expect(state.phase).toBe("completed");
    expect(state.outcomeEvidence).toContainEqual({
      type: "participant_outcome",
      sourceId: "outcome-1",
      observedAt: "2026-07-13T00:00:00.000Z",
    });
  });
});
