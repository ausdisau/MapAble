/**
 * Starting Work dependency graph — connects domains without duplicating writers.
 * Candidate ≠ available ≠ compatible ≠ participant approved ≠ confirmed.
 */

export type JourneyDependencyNode = {
  id: string;
  kind:
    | "participant_goal"
    | "communication_passport"
    | "worker_readiness"
    | "care_shift"
    | "transport_quote"
    | "transport_trip"
    | "venue_entrance"
    | "indoor_route"
    | "equipment"
    | "billing_evidence"
    | "return_journey"
    | "outcome_review"
    | "visit_pack";
  label: string;
  state:
    | "requested"
    | "quoted"
    | "accepted"
    | "assigned"
    | "confirmed"
    | "delivered"
    | "reviewed"
    | "invoiced"
    | "outcome_achieved"
    | "disputed"
    | "recovery_required"
    | "blocked"
    | "unknown"
    | "not_started";
  entityRef?: string;
};

export type JourneyDependencyEdge = {
  from: string;
  to: string;
  relation: "requires" | "enables" | "evidences" | "recovers";
};

export type JourneyDependencyGraph = {
  nodes: JourneyDependencyNode[];
  edges: JourneyDependencyEdge[];
};

export type StateHonestyMap = {
  careAgreement: "requested" | "accepted" | "not_started";
  transportQuote: "quoted" | "accepted" | "blocked" | "not_started";
  transportTrip: "requested" | "confirmed" | "delivered" | "blocked" | "not_started";
  workerReadiness: "evaluated" | "blocked" | "not_started";
  accessCast: "reviewed" | "unknown" | "not_started";
  visitPack: "delivered" | "expired" | "not_started";
  serviceDelivery: "delivered" | "disputed" | "not_started";
  outcome: "reviewed" | "declined" | "outcome_achieved" | "not_started";
  invoice: "invoiced" | "disputed" | "not_started";
  regionalCapacity: "candidate" | "participant_approved" | "confirmed" | "not_started";
};

export function buildStartingWorkDependencyGraph(input: {
  blocked: boolean;
  failureMode?: string;
  stepsCompleted: string[];
}): JourneyDependencyGraph {
  const has = (step: string) => input.stepsCompleted.includes(step);
  const blockedAt = (step: string) =>
    input.blocked && !has(step) ? ("blocked" as const) : undefined;

  const nodes: JourneyDependencyNode[] = [
    {
      id: "goal",
      kind: "participant_goal",
      label: "Start work at Harbour Civic Centre",
      state: "confirmed",
    },
    {
      id: "passport",
      kind: "communication_passport",
      label: "Communication Passport",
      state: has("worker_fields_disclosed")
        ? "accepted"
        : blockedAt("worker_fields_disclosed") ?? "requested",
      entityRef: "synthetic:passport:taylor",
    },
    {
      id: "readiness",
      kind: "worker_readiness",
      label: "Worker readiness reasons",
      state: has("readiness_evaluated")
        ? "confirmed"
        : blockedAt("readiness_evaluated") ?? "not_started",
      entityRef: "synthetic:readiness:eval",
    },
    {
      id: "care",
      kind: "care_shift",
      label: "Care shift / agreement",
      state: has("care_authorised")
        ? "accepted"
        : blockedAt("care_authorised") ?? "not_started",
      entityRef: "synthetic:care:request",
    },
    {
      id: "quote",
      kind: "transport_quote",
      label: "Accessible transport quote",
      state: has("transport_authorised")
        ? "accepted"
        : input.failureMode === "inaccessible_vehicle"
          ? "blocked"
          : "quoted",
      entityRef: "synthetic:transport:quote",
    },
    {
      id: "trip",
      kind: "transport_trip",
      label: "Transport trip",
      state: has("transport_authorised")
        ? "confirmed"
        : blockedAt("transport_authorised") ?? "not_started",
      entityRef: "synthetic:transport:trip",
    },
    {
      id: "entrance",
      kind: "venue_entrance",
      label: "Harbour west entrance",
      state: has("door_to_room_preflight") ? "confirmed" : "unknown",
      entityRef: "harbour_civic.entrance_west",
    },
    {
      id: "indoor",
      kind: "indoor_route",
      label: "Door-to-room preflight",
      state:
        input.failureMode === "lift_outage"
          ? "unknown"
          : has("door_to_room_preflight")
            ? "confirmed"
            : "not_started",
      entityRef: "harbour_civic.room_3_12",
    },
    {
      id: "equipment",
      kind: "equipment",
      label: "Equipment dependencies",
      state:
        input.failureMode === "equipment_breakdown"
          ? "blocked"
          : has("equipment_checked")
            ? "confirmed"
            : "not_started",
    },
    {
      id: "visit_pack",
      kind: "visit_pack",
      label: "Companion Visit Pack",
      state:
        input.failureMode === "lost_phone"
          ? "blocked"
          : has("visit_pack_compiled")
            ? "delivered"
            : "not_started",
    },
    {
      id: "billing",
      kind: "billing_evidence",
      label: "BillingServiceRecord evidence",
      state:
        input.failureMode === "rejected_invoice"
          ? "disputed"
          : has("invoice_created")
            ? "invoiced"
            : "not_started",
      entityRef: "synthetic:billing:service_record",
    },
    {
      id: "return",
      kind: "return_journey",
      label: "Return journey",
      state: has("return_transport_cancelled")
        ? "recovery_required"
        : "not_started",
    },
    {
      id: "outcome",
      kind: "outcome_review",
      label: "Participant outcome review",
      state:
        input.failureMode === "participant_declines_outcome_review"
          ? "reviewed"
          : has("outcome_reviewed")
            ? "outcome_achieved"
            : "not_started",
    },
  ];

  const edges: JourneyDependencyEdge[] = [
    { from: "goal", to: "passport", relation: "requires" },
    { from: "passport", to: "readiness", relation: "requires" },
    { from: "readiness", to: "care", relation: "enables" },
    { from: "care", to: "quote", relation: "requires" },
    { from: "quote", to: "trip", relation: "enables" },
    { from: "trip", to: "entrance", relation: "requires" },
    { from: "entrance", to: "indoor", relation: "requires" },
    { from: "equipment", to: "care", relation: "requires" },
    { from: "indoor", to: "visit_pack", relation: "enables" },
    { from: "care", to: "billing", relation: "evidences" },
    { from: "trip", to: "billing", relation: "evidences" },
    { from: "care", to: "outcome", relation: "evidences" },
    { from: "return", to: "trip", relation: "recovers" },
  ];

  return { nodes, edges };
}

export function buildStateHonesty(input: {
  blocked: boolean;
  failureMode?: string;
  stepsCompleted: string[];
}): StateHonestyMap {
  const has = (step: string) => input.stepsCompleted.includes(step);
  return {
    careAgreement: has("care_authorised") ? "accepted" : "not_started",
    transportQuote:
      input.failureMode === "inaccessible_vehicle"
        ? "blocked"
        : has("transport_authorised")
          ? "accepted"
          : has("care_authorised")
            ? "quoted"
            : "not_started",
    transportTrip:
      input.failureMode === "inaccessible_vehicle"
        ? "blocked"
        : has("service_events_recorded")
          ? "delivered"
          : has("transport_authorised")
            ? "confirmed"
            : "not_started",
    workerReadiness:
      input.failureMode === "stale_credential"
        ? "blocked"
        : has("readiness_evaluated")
          ? "evaluated"
          : "not_started",
    accessCast:
      input.failureMode === "lift_outage"
        ? "unknown"
        : has("door_to_room_preflight")
          ? "reviewed"
          : "not_started",
    visitPack:
      input.failureMode === "lost_phone"
        ? "expired"
        : has("visit_pack_compiled")
          ? "delivered"
          : "not_started",
    serviceDelivery: has("service_events_recorded")
      ? input.failureMode === "provider_disputes_evidence"
        ? "disputed"
        : "delivered"
      : "not_started",
    outcome:
      input.failureMode === "participant_declines_outcome_review"
        ? "declined"
        : has("outcome_reviewed")
          ? "outcome_achieved"
          : "not_started",
    invoice:
      input.failureMode === "rejected_invoice"
        ? "disputed"
        : has("invoice_created")
          ? "invoiced"
          : "not_started",
    regionalCapacity: has("participant_approved_replacement")
      ? "participant_approved"
      : has("regional_candidates_found")
        ? "candidate"
        : "not_started",
  };
}
