/**
 * AccessCast (MapAble Access Weather) feature flags.
 * Product flags default OFF. Permanent deny flags cannot be enabled by client params.
 */

function envTrue(name: string): boolean {
  const v = process.env[name];
  return v === "true" || v === "1";
}

export type AccessCastMode =
  | "documentation"
  | "synthetic"
  | "shadow"
  | "supervised_pilot"
  | "limited_release"
  | "production";

function readMode(): AccessCastMode {
  const raw = (process.env.MAPABLE_ACCESSCAST_MODE ?? "synthetic").toLowerCase();
  switch (raw) {
    case "documentation":
    case "synthetic":
    case "shadow":
    case "supervised_pilot":
    case "limited_release":
    case "production":
      return raw;
    default:
      return "synthetic";
  }
}

/** Permanent denies — always false regardless of env. */
export const ACCESSCAST_PERMANENT_DENY_FLAGS = {
  safetyGuarantee: false,
  autoRouteChange: false,
  autoBooking: false,
  backgroundLocation: false,
  diagnosisInference: false,
  aiStateDecision: false,
  paidConfidence: false,
} as const;

export const accessCastFlags = {
  get enabled() {
    return envTrue("MAPABLE_ACCESSCAST_ENABLED");
  },
  get mode(): AccessCastMode {
    return readMode();
  },
  get placeOutlook() {
    return envTrue("MAPABLE_ACCESSCAST_PLACE_OUTLOOK_ENABLED");
  },
  get journeyOutlook() {
    return envTrue("MAPABLE_ACCESSCAST_JOURNEY_OUTLOOK_ENABLED");
  },
  get timeline() {
    return envTrue("MAPABLE_ACCESSCAST_TIMELINE_ENABLED");
  },
  get notifications() {
    return envTrue("MAPABLE_ACCESSCAST_NOTIFICATIONS_ENABLED");
  },
  get venueConfirmation() {
    return envTrue("MAPABLE_ACCESSCAST_VENUE_CONFIRMATION_ENABLED");
  },
  get environmentalAdapter() {
    return envTrue("MAPABLE_ACCESSCAST_ENVIRONMENTAL_ADAPTER_ENABLED");
  },
  get eventMode() {
    return envTrue("MAPABLE_ACCESSCAST_EVENT_MODE_ENABLED");
  },
  get publicMap() {
    return envTrue("MAPABLE_ACCESSCAST_PUBLIC_MAP_ENABLED");
  },
  get partnerApi() {
    return envTrue("MAPABLE_ACCESSCAST_PARTNER_API_ENABLED");
  },
  get allowSyntheticExecution() {
    if (!this.enabled) return false;
    const mode = this.mode;
    return mode === "synthetic" || mode === "shadow" || mode === "documentation";
  },
};

export function assertClientCannotEnableAccessCastDenyFlags(
  clientParams: Record<string, string | undefined>,
): string[] {
  const blocked: string[] = [];
  const denyKeys = [
    "MAPABLE_ACCESSCAST_SAFETY_GUARANTEE_ENABLED",
    "MAPABLE_ACCESSCAST_AUTO_ROUTE_CHANGE_ENABLED",
    "MAPABLE_ACCESSCAST_AUTO_BOOKING_ENABLED",
    "MAPABLE_ACCESSCAST_BACKGROUND_LOCATION_ENABLED",
    "MAPABLE_ACCESSCAST_DIAGNOSIS_INFERENCE_ENABLED",
    "MAPABLE_ACCESSCAST_AI_STATE_DECISION_ENABLED",
    "MAPABLE_ACCESSCAST_PAID_CONFIDENCE_ENABLED",
  ];
  for (const key of denyKeys) {
    const v = clientParams[key];
    if (v === "true" || v === "1") blocked.push(key);
  }
  return blocked;
}
