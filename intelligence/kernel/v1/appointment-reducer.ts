import type {
  AppointmentAuthorityDecision,
  AppointmentEvent,
  AppointmentMissionState,
} from "./appointment-types";

export function createAppointmentMissionState(params: {
  missionId: string;
  participantId: string;
  outcome: string;
  authority: AppointmentAuthorityDecision;
  dependencies?: AppointmentMissionState["dependencies"];
}): AppointmentMissionState {
  return {
    missionId: params.missionId,
    participantId: params.participantId,
    outcome: params.outcome,
    phase:
      params.authority.decision === "human_review_required"
        ? "awaiting_human_review"
        : "draft",
    authority: params.authority,
    dependencies: params.dependencies ?? [],
    pendingConfirmations: [],
    humanReviewRequired:
      params.authority.decision === "human_review_required",
    receipts: [],
    outcomeEvidence: [],
    events: [],
  };
}

export function reduceAppointmentEvent(
  state: AppointmentMissionState,
  event: AppointmentEvent,
): AppointmentMissionState {
  if (state.events.some((existing) => existing.id === event.id)) {
    return state;
  }

  const next: AppointmentMissionState = {
    ...state,
    dependencies: state.dependencies.map((item) => ({
      ...item,
      evidence: [...item.evidence],
    })),
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
      if (Array.isArray(event.payload.dependencies)) {
        next.dependencies = (
          event.payload.dependencies as AppointmentMissionState["dependencies"]
        ).map((item) => ({ ...item, evidence: [...item.evidence] }));
      } else {
        markDependency(
          next,
          "support_intelligence",
          event.severity === "information" ? "confirmed" : "attention",
          event.entityId ?? event.id,
        );
      }
      return next;
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
      next.phase =
        next.pendingConfirmations.length === 0 && !next.humanReviewRequired
          ? "coordinating"
          : next.phase;
      return next;
    case "transport_action_confirmed":
      removePending(next, "transport");
      addReceipt(next, event);
      markDependency(next, "transport", "confirmed", event.entityId);
      next.phase =
        next.pendingConfirmations.length === 0 && !next.humanReviewRequired
          ? "coordinating"
          : next.phase;
      return next;
    case "human_review_created":
      next.humanReviewRequired = true;
      next.phase = "awaiting_human_review";
      return next;
    case "continuity_alerted":
      if (event.severity === "urgent") {
        next.humanReviewRequired = true;
        next.phase = "awaiting_human_review";
      }
      return next;
    case "service_completed": {
      const receipt = event.payload.receipt;
      if (receipt && typeof receipt === "object") {
        addUniqueReceipt(
          next,
          receipt as AppointmentMissionState["receipts"][number],
        );
      } else if (event.entityId) {
        addReceipt(next, event);
      }
      if (event.entityId) {
        addUniqueOutcomeEvidence(next, {
          type: "service_completed",
          sourceId: event.entityId,
          observedAt: event.occurredAt,
        });
      }
      if (allRequiredDependenciesConfirmed(next)) next.phase = "ready";
      return next;
    }
    case "outcome_recorded": {
      const evidence = event.payload.evidence;
      if (evidence && typeof evidence === "object") {
        addUniqueOutcomeEvidence(
          next,
          evidence as AppointmentMissionState["outcomeEvidence"][number],
        );
      } else if (event.entityId) {
        addUniqueOutcomeEvidence(next, {
          type: "participant_outcome",
          sourceId: event.entityId,
          observedAt: event.occurredAt,
        });
      }
      next.phase = "completed";
      return next;
    }
  }
}

export function replayAppointmentMission(
  initial: AppointmentMissionState,
  events: AppointmentEvent[],
): AppointmentMissionState {
  return events.reduce(reduceAppointmentEvent, initial);
}

function addPending(
  state: AppointmentMissionState,
  value: "care" | "transport",
) {
  if (!state.pendingConfirmations.includes(value)) {
    state.pendingConfirmations.push(value);
  }
}

function removePending(
  state: AppointmentMissionState,
  value: "care" | "transport",
) {
  state.pendingConfirmations = state.pendingConfirmations.filter(
    (item) => item !== value,
  );
}

function addReceipt(
  state: AppointmentMissionState,
  event: AppointmentEvent,
) {
  if (!event.entityId) return;
  addUniqueReceipt(state, {
    actionType: event.type,
    entityType:
      typeof event.payload.entityType === "string"
        ? event.payload.entityType
        : event.source,
    entityId: event.entityId,
    receiptId:
      typeof event.payload.receiptId === "string"
        ? event.payload.receiptId
        : event.id,
  });
}

function addUniqueReceipt(
  state: AppointmentMissionState,
  receipt: AppointmentMissionState["receipts"][number],
) {
  if (!state.receipts.some((item) => item.receiptId === receipt.receiptId)) {
    state.receipts.push(receipt);
  }
}

function addUniqueOutcomeEvidence(
  state: AppointmentMissionState,
  evidence: AppointmentMissionState["outcomeEvidence"][number],
) {
  if (
    !state.outcomeEvidence.some(
      (item) =>
        item.type === evidence.type &&
        item.sourceId === evidence.sourceId &&
        item.observedAt === evidence.observedAt,
    )
  ) {
    state.outcomeEvidence.push(evidence);
  }
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
  if (evidence && !dependency.evidence.includes(evidence)) {
    dependency.evidence.push(evidence);
  }
}

function applyDependencyEvidence(
  state: AppointmentMissionState,
  event: AppointmentEvent,
) {
  const dependencyId =
    event.type === "access_evidence_read"
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
