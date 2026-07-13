import { describe, expect, it } from "vitest";

import {
  reduceAppointmentMission,
  replayAppointmentMission,
} from "@/intelligence/kernel/v1/event-reducer";
import type {
  AppointmentEvent,
  AppointmentMissionState,
} from "@/intelligence/kernel/v1/appointment-types";

const initial: AppointmentMissionState = {
  missionId: "mission-1",
  participantId: "participant-1",
  outcome: "Attend my appointment.",
  phase: "awaiting_participant",
  authority: {
    participantId: "participant-1",
    decision: "allow",
    permittedReads: ["appointment_input"],
    permittedActions: ["draft_care_request", "draft_transport_request"],
    prohibitedActions: ["assign_worker_or_provider"],
    reasons: ["Participant supplied the mission."],
  },
  dependencies: [
    { id: "appointment", label: "Appointment", status: "confirmed", evidence: [] },
    { id: "care", label: "Care", status: "attention", evidence: [] },
    { id: "transport", label: "Transport", status: "attention", evidence: [] },
  ],
  pendingConfirmations: ["care", "transport"],
  humanReviewRequired: false,
  receipts: [],
  outcomeEvidence: [],
  events: [],
};

function event(
  id: string,
  type: AppointmentEvent["type"],
  overrides: Partial<AppointmentEvent> = {},
): AppointmentEvent {
  return {
    id,
    missionId: "mission-1",
    participantId: "participant-1",
    type,
    source: "participant",
    severity: "information",
    occurredAt: "2026-07-13T12:00:00.000Z",
    summary: type,
    entityId: null,
    payload: {},
    ...overrides,
  };
}

describe("CareOS appointment event replay", () => {
  it("applies the same event id only once", () => {
    const confirmed = event("event-confirm-care", "care_action_confirmed", {
      source: "care",
      entityId: "care-request-1",
      payload: { receiptId: "receipt-1", entityType: "CareRequest" },
    });

    const state = replayAppointmentMission(initial, [confirmed, confirmed]);

    expect(state.events).toHaveLength(1);
    expect(state.receipts).toHaveLength(1);
    expect(state.pendingConfirmations).toEqual(["transport"]);
  });

  it("keeps a correction as new evidence linked to the earlier outcome", () => {
    const first = event("outcome-1", "outcome_recorded", {
      entityId: "outcome-1",
      summary: "The appointment went well.",
      payload: {
        evidence: {
          type: "participant_outcome",
          sourceId: "outcome-1",
          observedAt: "2026-07-13T12:00:00.000Z",
          summary: "The appointment went well.",
        },
      },
    });
    const correction = event("outcome-2", "outcome_recorded", {
      entityId: "outcome-2",
      occurredAt: "2026-07-13T13:00:00.000Z",
      summary: "Correction: transport arrived late.",
      payload: {
        evidence: {
          type: "participant_outcome_correction",
          sourceId: "outcome-2",
          observedAt: "2026-07-13T13:00:00.000Z",
          summary: "Correction: transport arrived late.",
          correctionOf: "outcome-1",
        },
      },
    });

    const state = reduceAppointmentMission(
      reduceAppointmentMission(initial, first),
      correction,
    );

    expect(state.outcomeEvidence).toHaveLength(2);
    expect(state.outcomeEvidence[1]).toMatchObject({
      type: "participant_outcome_correction",
      correctionOf: "outcome-1",
    });
  });
});
