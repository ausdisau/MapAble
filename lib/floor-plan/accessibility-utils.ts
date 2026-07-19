import type { FloorPlanFeature } from "@/lib/floor-plan/schemas";

const MEASUREMENT_LABELS: Record<string, string> = {
  doorWidthMm: "Clear doorway width",
  corridorWidthMm: "Corridor width",
  thresholdHeightMm: "Threshold height",
  counterHeightMm: "Counter height",
  liftDoorWidthMm: "Lift door width",
  turningCircleMm: "Turning circle",
  rampGradient: "Ramp gradient",
  distanceMetres: "Distance",
};

export function formatMeasurement(key: string, value: number | string): string {
  const label = MEASUREMENT_LABELS[key] ?? key;
  if (key.endsWith("Mm") && typeof value === "number") {
    return `${label}: ${value.toLocaleString()} mm`;
  }
  if (key === "distanceMetres" && typeof value === "number") {
    return `${label}: ${value.toLocaleString()} metres`;
  }
  return `${label}: ${value}`;
}

export function formatFeatureMeasurements(
  feature: FloorPlanFeature,
): string[] {
  if (!feature.measurements) return [];
  return Object.entries(feature.measurements)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([key, value]) => formatMeasurement(key, value as number | string));
}

export function statusTrustLabel(
  status: FloorPlanFeature["status"],
): string {
  switch (status) {
    case "verified":
      return "MapAble verified";
    case "venue_claimed":
      return "Venue supplied";
    case "community_reported":
      return "Community reported";
    case "unknown":
      return "Not yet verified";
    default:
      return "Status unknown";
  }
}

export function operationalStatusLabel(
  status: FloorPlanFeature["operationalStatus"],
): string {
  switch (status) {
    case "available":
      return "Available";
    case "unavailable":
      return "Unavailable";
    case "temporarily_closed":
      return "Temporarily closed";
    case "unknown":
      return "Status unknown";
    default:
      return "Status unknown";
  }
}

export const FLOOR_PLAN_DISCLAIMER =
  "Floor plan information describes observed accessibility features at the recorded verification date. Conditions may have changed. It is not, by itself, certification of legal compliance.";

export const EMERGENCY_DISCLAIMER =
  "In an emergency, follow on-site instructions and emergency personnel. This floor plan may not reflect temporary hazards or current conditions.";
