/**
 * Typed feature flags for the indoor accessibility platform (Iterations 2–14).
 * Server must enforce flags independently of the client.
 */

export type IndoorAccessibilityFeatureFlag =
  | "floorPlanAuthoring"
  | "floorPlanReviewWorkflow"
  | "floorPlanCommunityCorrections"
  | "accessibilityPreferenceProfiles"
  | "personalAccessibilityFit"
  | "verifiedIndoorRouting"
  | "operationalStatus"
  | "statusSubscriptions"
  | "doorToDestinationJourneys"
  | "sharedVisitPlans"
  | "offlineVenuePacks"
  | "indoorCheckpoints"
  | "multimodalGuidance"
  | "spatialPreview3D"
  | "webArPreview"
  | "accreditationConsole"
  | "partnerApi"
  | "partnerEmbeds";

/** Production defaults — experimental features disabled unless env enables them. */
const PRODUCTION_DEFAULTS: Record<IndoorAccessibilityFeatureFlag, boolean> = {
  floorPlanAuthoring: false,
  floorPlanReviewWorkflow: false,
  floorPlanCommunityCorrections: true,
  accessibilityPreferenceProfiles: true,
  personalAccessibilityFit: true,
  verifiedIndoorRouting: true,
  operationalStatus: true,
  statusSubscriptions: false,
  doorToDestinationJourneys: false,
  sharedVisitPlans: false,
  offlineVenuePacks: false,
  indoorCheckpoints: false,
  multimodalGuidance: true,
  spatialPreview3D: false,
  webArPreview: false,
  accreditationConsole: false,
  partnerApi: false,
  partnerEmbeds: false,
};

/** Development defaults — more features on for local testing. */
const DEVELOPMENT_DEFAULTS: Record<IndoorAccessibilityFeatureFlag, boolean> = {
  ...PRODUCTION_DEFAULTS,
  floorPlanAuthoring: true,
  floorPlanReviewWorkflow: true,
  personalAccessibilityFit: true,
  verifiedIndoorRouting: true,
  operationalStatus: true,
  multimodalGuidance: true,
  sharedVisitPlans: true,
  offlineVenuePacks: true,
  indoorCheckpoints: true,
  accreditationConsole: true,
  partnerApi: true,
  partnerEmbeds: true,
};

function envOverride(flag: IndoorAccessibilityFeatureFlag): boolean | undefined {
  const key = `INDOOR_FLAG_${flag.replace(/([A-Z])/g, "_$1").toUpperCase()}`;
  const val = process.env[key];
  if (val === "true" || val === "1") return true;
  if (val === "false" || val === "0") return false;
  return undefined;
}

function baseDefaults(): Record<IndoorAccessibilityFeatureFlag, boolean> {
  const isDev = process.env.NODE_ENV === "development";
  return isDev ? { ...DEVELOPMENT_DEFAULTS } : { ...PRODUCTION_DEFAULTS };
}

export function getIndoorFeatureFlags(): Record<IndoorAccessibilityFeatureFlag, boolean> {
  const flags = baseDefaults();
  for (const key of Object.keys(flags) as IndoorAccessibilityFeatureFlag[]) {
    const override = envOverride(key);
    if (override !== undefined) flags[key] = override;
  }
  return flags;
}

export function isIndoorFeatureEnabled(flag: IndoorAccessibilityFeatureFlag): boolean {
  return getIndoorFeatureFlags()[flag];
}

/** Client-safe subset (only non-sensitive flags exposed to browser). */
export function getClientIndoorFeatureFlags(): Record<IndoorAccessibilityFeatureFlag, boolean> {
  return getIndoorFeatureFlags();
}

export const INDOOR_FEATURE_DISABLED_CODE = "INDOOR_FEATURE_DISABLED";
