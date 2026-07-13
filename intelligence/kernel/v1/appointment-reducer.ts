import type { AppointmentAuthorityDecision, AppointmentEvent, AppointmentMissionState } from "./appointment-types";

export function createAppointmentMissionState(params: {
  missionId: string;
  participantId: string;
  outcome: string;
  authority: AppointmentAuthorityDecision;
}): AppointmentMissionState {
  return {
    missionId: params.missionId,
    participantId: params.participantId,
    outcome: params.outcome,
    phase: params.authority.decision === "human_review_required" ? "awaiting_human_review" : "draft",
    authority: params.authority,
    dependencies: [],
    pendingConfirmations: [],
    humanReviewRequired: params.authority.decision === "human_review_required",
    receipts: [],
    outcomeEvidence: [],
    events: [],
  };
}

export function reduceAppointmentEvent(
  state: AppointmentMissionState,
  event: AppointmentEvent,
): AppointmentMissionState {
  const next = { ...state, events: [...state.events, event] };

  if (event.type === "support_intelligence_generated") {
    next.phase = state.humanReviewRequired ? "awaiting_human_review" : "awaiting_participant";
    next.dependencies = Array.isArray(event.payload.dependencies)
      ? (event.payload.dependencies as AppointmentMissionState["dependencies"])
      : state.dependencies;
  }
  if (event.type === "care_action_prepared" && !next.pendingConfirmations.includes("care")) {
    next.pendingConfirmations = [...next.pendingConfirmations, "care"];
  }
  if (event.type === "transport_action_prepared" && !next.pendingConfirmations.includes("transport")) {
    next.pendingConfirmations = [...next.pendingConfirmations, "transport"];
  }
  if (event.type === "care_action_confirmed") {
    next.pendingConfirmations = next.pendingConfirmations.filter((item) => item !== "care");
    next.phase = next.pendingConfirmations.length === 0 && !next.humanReviewRequired ? "coordinating" : next.phase;
  }
  if (event.type === "transport_action_confirmed") {
    next.pendingConfirmations = next.pendingConfirmations.filter((item) => item !== "transport");
    next.phase = next.pendingConfirmations.length === 0 && !next.humanReviewRequired ? "coordinating" : next.phase;
  }
  if (event.type === "human_review_created") {
    next.humanReviewRequired = true;
    next.phase = "awaiting_human_review";
  }
  if (event.type === "continuity_alerted" && event.severity === "urgent") {
    next.humanReviewRequired = true;
    next.phase = "awaiting_human_review";
  }
  if (event.type === "service_completed") {
    const receipt = event.payload.receipt;
    if (receipt && typeof receipt === "object") {
      next.receipts = [...next.receipts, receipt as AppointmentMissionState["receipts"][number]];
    }
  }
  if (event.type === "outcome_recorded") {
    const evidence = event.payload.evidence;
    if (evidence && typeof evidence === "object") {
      next.outcomeEvidence = [...next.outcomeEvidence, evidence as AppointmentMissionState["outcomeEvidence"][number]];
    }
    next.phase = "completed";
  }

  return next;
}

export function replayAppointmentMission(
  initial: AppointmentMissionState,
  events: AppointmentEvent[],
): AppointmentMissionState {
  return events.reduce(reduceAppointmentEvent, initial);
}
