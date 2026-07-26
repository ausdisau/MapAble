/**
 * Feature-specific freshness — different evidence expires differently.
 * Stale/unknown never equals accessible.
 */

export type FreshnessPolicyKey =
  | "door_width"
  | "entrance_availability"
  | "lift_status"
  | "temporary_obstruction"
  | "accessible_toilet"
  | "event_layout"
  | "staff_assistance"
  | "public_transport_accessibility"
  | "default";

export type FreshnessPolicy = {
  key: FreshnessPolicyKey;
  maxAgeHours: number;
  description: string;
};

export const FEATURE_FRESHNESS_POLICIES: Record<FreshnessPolicyKey, FreshnessPolicy> = {
  door_width: {
    key: "door_width",
    maxAgeHours: 24 * 365,
    description: "Door clear width changes rarely; annual verification preferred",
  },
  entrance_availability: {
    key: "entrance_availability",
    maxAgeHours: 24 * 7,
    description: "Entrance open/closed status — weekly unless temporary",
  },
  lift_status: {
    key: "lift_status",
    maxAgeHours: 24,
    description: "Lift operational status — daily freshness",
  },
  temporary_obstruction: {
    key: "temporary_obstruction",
    maxAgeHours: 6,
    description: "Temporary obstruction — short TTL",
  },
  accessible_toilet: {
    key: "accessible_toilet",
    maxAgeHours: 24 * 30,
    description: "Accessible toilet features — monthly verification",
  },
  event_layout: {
    key: "event_layout",
    maxAgeHours: 12,
    description: "Event layout — half-day freshness",
  },
  staff_assistance: {
    key: "staff_assistance",
    maxAgeHours: 24,
    description: "Staff assistance availability — daily",
  },
  public_transport_accessibility: {
    key: "public_transport_accessibility",
    maxAgeHours: 24 * 14,
    description: "PT stop accessibility — fortnightly",
  },
  default: {
    key: "default",
    maxAgeHours: 24 * 30,
    description: "Default monthly freshness",
  },
};

export function freshnessPolicyForConcept(ontologyConceptId: string): FreshnessPolicy {
  switch (ontologyConceptId) {
    case "physical.minimum_clear_width_mm":
      return FEATURE_FRESHNESS_POLICIES.door_width;
    case "physical.step_free":
    case "physical.revolving_door":
    case "physical.staff_dependent_entrance":
      return FEATURE_FRESHNESS_POLICIES.entrance_availability;
    case "physical.lift_operational":
      return FEATURE_FRESHNESS_POLICIES.lift_status;
    case "physical.accessible_toilet":
      return FEATURE_FRESHNESS_POLICIES.accessible_toilet;
    default:
      if (ontologyConceptId.includes("temporary") || ontologyConceptId.includes("obstruction")) {
        return FEATURE_FRESHNESS_POLICIES.temporary_obstruction;
      }
      return FEATURE_FRESHNESS_POLICIES.default;
  }
}

export function computeExpiryFromObservedAt(
  observedAt: Date,
  policy: FreshnessPolicy,
): Date {
  return new Date(observedAt.getTime() + policy.maxAgeHours * 60 * 60 * 1000);
}
