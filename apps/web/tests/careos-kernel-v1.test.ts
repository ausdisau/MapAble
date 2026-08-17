import { describe, expect, it } from "vitest";

import { createAppointmentMissionState, reduceAppointmentEvent, replayAppointmentMission } from "@/intelligence/kernel/v1/appointment-reducer";
import type { AppointmentAuthorityDecision, AppointmentEvent } from "@/intelligence/kernel/v1/appointment-types";

const authority: AppointmentAuthorityDecision = {
  participantId: "participant-1",
  decision: "allow",
  permittedReads: ["appointment.summary", "care.summary"],
  permittedActions: ["draft_care_request", "draft_transport_request"],
  prohibitedActions: ["assign_worker", "assign_provider", "approve_payment"],
  reasons: [],
};

function event(type: AppointmentEvent["type"], payload: Record<string, unknown> = {}, severity: AppointmentEvent["severity"] = "information"): AppointmentEvent {
  return {
    id: `${type}-1`,
    missionId: "mission-1",
    participantId: "participant-1",
    type,
    source: "careos",
    severity,
    occurredAt: "2026-07-13T00:00:00.000Z",
    summary: type,
    entityId: null,
    payload,
  };
}

describe("CareOS Kernel v1 appointment mission", () => {
  it("starts with one authority decision and prohibited autonomous actions", () => {
    const state = createAppointmentMissionState({
      missionId: "mission-1",
      participantId: "participant-1",
      outcome: "Attend an appointment",
      authority,
    });
    expect(state.authority.decision).toBe("allow");
    expect(state.authority.prohibitedActions).toContain("assign_worker");
    expect(state.authority.prohibitedActions).toContain("assign_provider");
  });

  it("replays the same event sequence into the same state", () => {
    const initial = createAppointmentMissionState({
      missionId: "mission-1",
      participantId: "participant-1",
      outcome: "Attend an appointment",
      authority,
    });
    const events = [
      event("mission_created"),
      event("support_intelligence_generated", {
        dependencies: [{ id: "care", label: "Care", status: "attention", evidence: [] }],
      }),
      event("care_action_prepared"),
      event("transport_action_prepared"),
    ];
    expect(replayAppointmentMission(initial, events)).toEqual(replayAppointmentMission(initial, events));
  });

  it("tracks separate participant confirmations for care and transport", () => {
    let state = createAppointmentMissionState({
      missionId: "mission-1",
      participantId: "participant-1",
      outcome: "Attend an appointment",
      authority,
    });
    state = reduceAppointmentEvent(state, event("care_action_prepared"));
    state = reduceAppointmentEvent(state, event("transport_action_prepared"));
    expect(state.pendingConfirmations).toEqual(["care", "transport"]);
    state = reduceAppointmentEvent(state, event("care_action_confirmed"));
    expect(state.pendingConfirmations).toEqual(["transport"]);
  });

  it("routes urgent continuity events to human review", () => {
    const initial = createAppointmentMissionState({
      missionId: "mission-1",
      participantId: "participant-1",
      outcome: "Attend an appointment",
      authority,
    });
    const state = reduceAppointmentEvent(initial, event("continuity_alerted", {}, "urgent"));
    expect(state.humanReviewRequired).toBe(true);
    expect(state.phase).toBe("awaiting_human_review");
  });

  it("records service receipts and outcome evidence before completing", () => {
    let state = createAppointmentMissionState({
      missionId: "mission-1",
      participantId: "participant-1",
      outcome: "Attend an appointment",
      authority,
    });
    state = reduceAppointmentEvent(state, event("service_completed", {
      receipt: { actionType: "submit_care_request", entityType: "CareRequest", entityId: "care-1", receiptId: "receipt-1" },
    }));
    state = reduceAppointmentEvent(state, event("outcome_recorded", {
      evidence: { type: "appointment_attended", sourceId: "calendar-1", observedAt: "2026-07-20T02:00:00.000Z" },
    }));
    expect(state.receipts).toHaveLength(1);
    expect(state.outcomeEvidence).toHaveLength(1);
    expect(state.phase).toBe("completed");
  });
});
