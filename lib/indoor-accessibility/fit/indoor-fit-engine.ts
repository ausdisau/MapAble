import type { IndoorAccessPreferences } from "@/lib/indoor-accessibility/fit/types";
import type { FloorPlanFeature } from "@/lib/floor-plan/schemas";
import type { OperationalStatus, TrustLevel } from "@/lib/indoor-accessibility/schemas/core";

export type IndoorFitResultCategory =
  | "matches_recorded_requirements"
  | "likely_match_with_caveats"
  | "information_incomplete"
  | "known_barrier"
  | "temporarily_unavailable"
  | "needs_personal_confirmation";

export type IndoorFitReason = {
  requirement: string;
  recordedValue?: string;
  featureId?: string;
  trustLevel?: TrustLevel;
};

export type IndoorFitResult = {
  result: IndoorFitResultCategory;
  summary: string;
  reasons: IndoorFitReason[];
};

function trustFromFeatureStatus(
  status: FloorPlanFeature["status"],
): TrustLevel {
  switch (status) {
    case "verified":
      return "mapable_verified";
    case "venue_claimed":
      return "venue_supplied";
    case "community_reported":
      return "community_reported";
    default:
      return "not_verified";
  }
}

export function evaluateIndoorFit(
  needs: IndoorAccessPreferences,
  features: FloorPlanFeature[],
  incidents: Array<{ featureId?: string | null; operationalStatus: string }> = [],
): IndoorFitResult {
  const reasons: IndoorFitReason[] = [];
  const blockedFeatureIds = new Set(
    incidents
      .filter((i) => i.operationalStatus === "unavailable" || i.operationalStatus === "temporarily_closed")
      .map((i) => i.featureId)
      .filter(Boolean) as string[],
  );

  if (needs.stepFreeRequired || needs.wheelchairUser || needs.powerchairUser) {
    const entrances = features.filter(
      (f) =>
        f.type === "accessible_entrance" ||
        f.type === "alternative_accessible_entrance",
    );
    if (entrances.length === 0) {
      reasons.push({
        requirement: "Step-free accessible entrance",
        recordedValue: "Not recorded on floor plan",
      });
    } else {
      const blocked = entrances.filter((e) => blockedFeatureIds.has(e.id));
      if (blocked.length === entrances.length) {
        return {
          result: "temporarily_unavailable",
          summary: "Recorded accessible entrances are currently reported unavailable.",
          reasons: blocked.map((e) => ({
            requirement: "Step-free entrance available",
            recordedValue: `${e.name} — unavailable`,
            featureId: e.id,
            trustLevel: trustFromFeatureStatus(e.status),
          })),
        };
      }
      const narrow = entrances.find(
        (e) =>
          e.measurements?.doorWidthMm != null &&
          e.measurements.doorWidthMm < (needs.powerchairUser ? 900 : 850),
      );
      if (narrow) {
        reasons.push({
          requirement: `Minimum doorway width: ${needs.powerchairUser ? 900 : 850} mm`,
          recordedValue: `${narrow.measurements!.doorWidthMm} mm at ${narrow.name}`,
          featureId: narrow.id,
          trustLevel: trustFromFeatureStatus(narrow.status),
        });
      }
    }
  }

  if (needs.accessibleToiletRequired) {
    const toilets = features.filter((f) => f.type === "accessible_toilet");
    if (toilets.length === 0) {
      reasons.push({
        requirement: "Accessible toilet on floor plan",
        recordedValue: "Not recorded",
      });
    }
  }

  if (needs.changingPlacesRequired) {
    const cp = features.filter((f) => f.type === "changing_places");
    if (cp.length === 0) {
      reasons.push({
        requirement: "Changing Places facility",
        recordedValue: "Not recorded on floor plan",
      });
    }
  }

  if (needs.quietSpaceRequired) {
    const quiet = features.filter(
      (f) => f.type === "quiet_room" || f.type === "low_sensory_zone",
    );
    if (quiet.length === 0) {
      reasons.push({
        requirement: "Quiet or low-sensory space",
        recordedValue: "Not recorded",
      });
    }
  }

  const barriers = reasons.filter((r) => r.recordedValue?.includes("mm at"));
  if (barriers.length > 0) {
    return {
      result: "known_barrier",
      summary: "A recorded feature does not meet your selected requirements.",
      reasons,
    };
  }

  if (reasons.length > 0) {
    return {
      result: "information_incomplete",
      summary: "Some required information is not recorded on the floor plan.",
      reasons,
    };
  }

  return {
    result: "matches_recorded_requirements",
    summary: "Recorded floor-plan features appear to match your selected requirements.",
    reasons: [],
  };
}
