export type TemporalAccessState =
  | "current"
  | "scheduled"
  | "temporarily_unavailable"
  | "historically_unreliable"
  | "stale"
  | "expired"
  | "disputed"
  | "superseded"
  | "unknown";

export const TEMPORAL_ACCESS_STATES: TemporalAccessState[] = [
  "current",
  "scheduled",
  "temporarily_unavailable",
  "historically_unreliable",
  "stale",
  "expired",
  "disputed",
  "superseded",
  "unknown",
];

export type TemporalAccessWindow = {
  state: TemporalAccessState;
  validFrom: string;
  validTo: string | null;
  reason: string;
  ontologyConceptId?: string;
};

/** Feature-specific default TTL guidance (days). Geometry lasts longer than ops. */
export const DEFAULT_TEMPORAL_TTL_DAYS: Record<string, number> = {
  "physical.minimum_clear_width_mm": 730,
  "physical.step_free": 365,
  "physical.accessible_toilet": 180,
  "physical.lift_operational": 1,
  "transport.accessible_vehicle": 1,
  "cognitive_communication.human_assistance": 7,
  temporary_obstruction: 1,
  event_layout: 1,
};
