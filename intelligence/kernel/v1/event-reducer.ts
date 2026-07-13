import type {
  AppointmentEvent,
  AppointmentMissionState,
} from "./appointment-types";

export function reduceAppointmentMission(
  state: AppointmentMissionState,
  event: AppointmentEvent,
): AppointmentMissionState {
  const next: AppointmentMissionState = {
    ...state,
    dependencies: state.dependencies.map((item) => ({ ...item })),
    pendingConfirmations: [...state.pendingConfirmations],
    receipts: [...state.receipts],
    outcomeEvidence: [...state.outcomeEvidence],
    events: [...state.events, event],
  };

  switch (event.type) {
    case "mission_created":
      return next;
    case "authority_evaluated":
      next.phase =
        next.authority.decision === "human_review_required"
          ? "awaiting_human_review"
          : "awaiting_participant";
      next.humanReviewRequired =
        next.authority.decision === "human_review_required";
      return next;
    case "support_intelligence_generated":
    case "access_evidence_read":
    case "provider_evidence_read":
    case "worker_evidence_read":
      applyDependencyEvidence(next, event);
      return next;
    case "care_action_prepared":
      addPending(next, "care");
      next.phase = "awaiting_participant";
      return next;
    case "transport_action_prepared":
      addPending(next, "transport");
      next.phase = "awaiting_participant";
      return next;
    case "care_action_confirmed":
      removePending(next, "care");
      addReceipt(next, event);
      markDependency(next, "care", "confirmed", event.entityId);
      next.phase = next.pendingConfirmations.length ? "awaiting_participant" : "coordinating";
      return next;
    case "transport_action_confirmed":
      removePending(next, "transport");
      addReceipt(next, event);
      markDependency(next, "transport", "confirmed", event.entityId);
      next.phase = next.pendingConfirmations.length ? "awaiting_participant" : "coordinating";
      return next;
    case "human_review_created":
      next.humanReviewRequired = true;
      next.phase = "awaiting_human_review";
      return next;
    case "continuity_alerted":
      next.phase = event.severity === "urgent" ? "awaiting_human_review" : next.phase;
      next.humanReviewRequired = next.humanReviewRequired || event.severity === "urgent";
      return next;
    case "service_completed":
      if (event.entityId) {
        next.outcomeEvidence.push({
          type: "service_completed",
          sourceId: event.entityId,
          observedAt: event.occurredAt,
        });
      }
      if (allRequiredDependenciesConfirmed(next)) next.phase = "ready";
      return next;
    case "outcome_recorded":
      if (event.entityId) {
        next.outcomeEvidence.push({
          type: "participant_outcome",
          sourceId: event.entityId,
          observedAt: event.occurredAt,
        });
      }
      next.phase = "completed";
      return next;
  }
}

function addPending(state: AppointmentMissionState, value: "care" | "transport") {
  if (!state.pendingConfirmations.includes(value)) state.pendingConfirmations.push(value);
}

function removePending(state: AppointmentMissionState, value: "care" | "transport") {
  state.pendingConfirmations = state.pendingConfirmations.filter((item) => item !== value);
}

function addReceipt(state: AppointmentMissionState, event: AppointmentEvent) {
  const receiptId = typeof event.payload.receiptId === "string" ? event.payload.receiptId : event.id;
  const entityType = typeof event.payload.entityType === "string" ? event.payload.entityType : event.source;
  if (!event.entityId) return;
  state.receipts.push({
    actionType: event.type,
    entityType,
    entityId: event.entityId,
    receiptId,
  });
}

function markDependency(
  state: AppointmentMissionState,
  id: string,
  status: AppointmentMissionState["dependencies"][number]["status"],
  evidence?: string | null,
) {
  const dependency = state.dependencies.find((item) => item.id === id);
  if (!dependency) return;
  dependency.status = status;
  if (evidence && !dependency.evidence.includes(evidence)) dependency.evidence.push(evidence);
}

function applyDependencyEvidence(state: AppointmentMissionState, event: AppointmentEvent) {
  const dependencyId =
    event.type === "support_intelligence_generated"
      ? "support_intelligence"
      : event.type === "access_evidence_read"
        ? "access"
        : event.type === "provider_evidence_read"
          ? "provider"
          : "worker";
  markDependency(
    state,
    dependencyId,
    event.severity === "information" ? "confirmed" : "attention",
    event.entityId ?? event.id,
  );
}

function allRequiredDependenciesConfirmed(state: AppointmentMissionState) {
  return state.dependencies
    .filter((item) => ["appointment", "care", "transport"].includes(item.id))
    .every((item) => item.status === "confirmed");
}
