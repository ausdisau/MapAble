/**
 * Legacy GAIS staging import guard — MapAble Signal / Access.
 *
 * The source is the 7 Nov 2026 GAIS review package in Google Drive.
 * This is NOT a loader, geocoder or publication pipeline. It accepts a
 * single already-reviewed staging record and returns an unverified intake
 * descriptor. It never stores anything or converts historical map icons
 * or "Verified" text into a current access finding.
 */
export type GaisLegacyStagingRecord = {
  source_record_id: string;
  name?: string | null;
  traffic_light_status?: string | null;
  mapable_verification_status?: string | null;
  original_verification_label?: string | null;
  original_marker_style?: string | null;
  source_layer?: string | null;
  longitude?: number | null;
  latitude?: number | null;
};

export type GaisAccessStagingDescriptor = {
  sourceRecordId: string;
  sourceLayer: string | null;
  sourceLabel: string;
  importedStatus: "unverified_legacy_import";
  featureRating: "unknown";
  verificationStatus: "unknown";
  suitability: "not_assessed";
  publicPublicationAllowed: false;
  readyForDayRouting: false;
  originalVerificationLabel: string | null;
  originalMarkerStyle: string | null;
  licenceVerified: false;
  reinspectionRequired: true;
  nextAction: "human_source_and_site_review";
};

export class GaisLegacyImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GaisLegacyImportError";
  }
}

export function isGaisStagingImportEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return (
    env.MAPABLE_GAIS_STAGING_DEMO_ENABLED === "true" &&
    env.NODE_ENV !== "production" &&
    env.VERCEL_ENV !== "production"
  );
}

export function toGaisAccessStagingDescriptor(
  record: GaisLegacyStagingRecord,
): GaisAccessStagingDescriptor {
  if (
    !record.source_record_id ||
    record.source_record_id.length > 200 ||
    !/^[a-zA-Z0-9_:.|-]+$/.test(record.source_record_id)
  ) {
    throw new GaisLegacyImportError("A safe and stable source_record_id is required.");
  }
  if (record.traffic_light_status !== "unknown") {
    throw new GaisLegacyImportError(
      "Legacy import traffic lights must be unknown. Do not inherit a historical rating.",
    );
  }
  if (record.mapable_verification_status !== "unverified_legacy_import") {
    throw new GaisLegacyImportError(
      "Legacy import verification must be unverified_legacy_import.",
    );
  }
  if (
    (record.latitude != null || record.longitude != null) &&
    (!Number.isFinite(record.latitude) ||
      !Number.isFinite(record.longitude) ||
      (record.latitude ?? 91) < -90 ||
      (record.latitude ?? 91) > 90 ||
      (record.longitude ?? 181) < -180 ||
      (record.longitude ?? 181) > 180)
  ) {
    throw new GaisLegacyImportError("Invalid coordinates. Do not geolocate by inference.");
  }
  const sourceLabel = (record.name || "Unlabelled legacy source").trim().slice(0, 140);
  return {
    sourceRecordId: record.source_record_id,
    sourceLayer: record.source_layer?.slice(0, 140) || null,
    sourceLabel,
    importedStatus: "unverified_legacy_import",
    featureRating: "unknown",
    verificationStatus: "unknown",
    suitability: "not_assessed",
    publicPublicationAllowed: false,
    readyForDayRouting: false,
    originalVerificationLabel: record.original_verification_label?.slice(0, 140) || null,
    originalMarkerStyle: record.original_marker_style?.slice(0, 140) || null,
    licenceVerified: false,
    reinspectionRequired: true,
    nextAction: "human_source_and_site_review",
  };
}
