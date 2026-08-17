import { describe, expect, it } from "vitest";

import {
  reduceAppointmentMission,
  replayAppointmentMission,
} from "@/intelligence/kernel/v1/event-reducer";
import type {
  AppointmentEvent,
  AppointmentMissionState,
} from "@/intelligence/kernel/v1/appointment-types";

function initialState(): AppointmentMissionState {
  return {
    missionId: "11111111-1111-4111-8111-111111111111",
    participantId: "participant-1",
    outcome: "Attend the appointment safely and return home.",
    phase: "draft",
    authority: {
      participantId: "participant-1",
      decision: "allow",
      permittedReads: ["appointment_input"],
      permittedActions: ["draft_care_request", "draft_transport_request"],
      prohibitedActions: ["assign_worker_or_provider"],
      reasons: ["Participant supplied the mission."],
    },
    dependencies: [
      { id: "appointment", label: "Appointment", status: "confirmed", evidence: ["participant_input"] },
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
  id: string,
  type: AppointmentEvent["type"],
  overrides: Partial<AppointmentEvent> = {},
): AppointmentEvent {
  return {
    id,
    missionId: "11111111-1111-4111-8111-111111111111",
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

describe("CareOS Kernel v1 idempotency", () => {
  it("ignores a repeated event with the same event ID", () => {
    const prepared = event(
      "22222222-2222-4222-8222-222222222222",
      "care_action_prepared",
    );
    const once = reduceAppointmentMission(initialState(), prepared);
    const twice = reduceAppointmentMission(once, prepared);

    expect(twice).toEqual(once);
    expect(twice.events).toHaveLength(1);
    expect(twice.pendingConfirmations).toEqual(["care"]);
  });

  it("replays the same ordered event stream deterministically", () => {
    const events: AppointmentEvent[] = [
      event("33333333-3333-4333-8333-333333333333", "care_action_prepared"),
      event("44444444-4444-4444-8444-444444444444", "transport_action_prepared"),
      event("55555555-5555-4555-8555-555555555555", "care_action_confirmed", {
        source: "care",
        entityId: "care-request-1",
        payload: { receiptId: "receipt-care", entityType: "CareRequest" },
      }),
    ];

    const firstReplay = replayAppointmentMission(initialState(), events);
    const secondReplay = replayAppointmentMission(initialState(), events);

    expect(secondReplay).toEqual(firstReplay);
    expect(firstReplay.events.map((item) => item.id)).toEqual(
      events.map((item) => item.id),
    );
  });

  it("keeps repeated persistence inputs stable at the state boundary", () => {
    const events = [
      event("66666666-6666-4666-8666-666666666666", "care_action_prepared"),
      event("66666666-6666-4666-8666-666666666666", "care_action_prepared"),
    ];
    const state = replayAppointmentMission(initialState(), events);

    expect(state.events).toHaveLength(1);
    expect(state.pendingConfirmations).toEqual(["care"]);
    expect(state.missionId).toBe(initialState().missionId);
  });
});
