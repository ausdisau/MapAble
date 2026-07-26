/**
 * MapAble Autonomous Vehicle (AV) framework — policy and integration boundaries.
 * Advisory routing and automation suggestions never replace human dispatch or safety review.
 */

export const AV_FRAMEWORK_VERSION = "1.0.0";

export const AV_GOVERNANCE = {
  version: AV_FRAMEWORK_VERSION,
  principles: [
    "Human dispatch and assignment — no autonomous dispatch or driver/vehicle assignment.",
    "Routing and optimisation outputs are advisory only; requiresHumanReview when suggested.",
    "Status changes follow explicit trip state machines; unsafe_to_continue triggers recovery workflows.",
    "Participant privacy: exact addresses only for authorised roles; agents must not exfiltrate PII.",
    "Incidents and safeguarding use the Safety centre; AV telemetry does not auto-report to NDIS Commission.",
  ],
  nonGoals: [
    "Autonomous high-risk decisions without human review",
    "Legal certification or homologation claims for AV systems",
    "Automatic NDIS / NDIA / Commission submission",
  ],
  saeLevelsReference: {
    "0": "No automation — human driver performs all tasks.",
    "1": "Driver assistance — steering OR acceleration/braking.",
    "2": "Partial — steering AND acceleration/braking (driver must monitor).",
    "3": "Conditional — system drives in ODD; driver must be ready to intervene.",
    "4": "High — system drives within ODD without driver intervention.",
    "5": "Full — system drives all conditions (not targeted by MapAble Core v1).",
  },
  mapableIntegration: {
    transportTripsApi: "/api/transport/trips",
    transportRoutingApi: "/api/transport/routing",
    participantUi: "/dashboard/transport",
    safetyCentre: "/dashboard/safety",
    publicSafeguards: "/safeguards",
  },
} as const;

export type AvAutomationCapability =
  | "advisory_routing"
  | "status_validation"
  | "vehicle_suitability_check"
  | "trip_read_via_api"
  | "autonomous_dispatch"
  | "autonomous_assignment";

export const AV_CAPABILITY_MATRIX: Record<
  AvAutomationCapability,
  { allowed: boolean; note: string }
> = {
  advisory_routing: {
    allowed: true,
    note: "OSRM/mock providers; estimates are not guaranteed ETAs.",
  },
  status_validation: {
    allowed: true,
    note: "Validate transitions against AV_TRIP_TRANSITIONS before API PATCH.",
  },
  vehicle_suitability_check: {
    allowed: true,
    note: "Accessibility flags only; does not certify vehicle compliance.",
  },
  trip_read_via_api: {
    allowed: true,
    note: "Requires authenticated session or service token; respect consent.",
  },
  autonomous_dispatch: {
    allowed: false,
    note: "Explicit product non-goal; use provider dispatch console.",
  },
  autonomous_assignment: {
    allowed: false,
    note: "Driver/vehicle assignment requires human confirmation.",
  },
};
