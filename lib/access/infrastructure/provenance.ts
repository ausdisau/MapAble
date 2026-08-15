/**
 * Access Graph provenance vocabulary (Epic 01).
 *
 * Storage uses Prisma `AccessProvenanceStatus`.
 * Read surfaces use portfolio `sourceClass` labels so AI-inferred
 * never appears as independently verified.
 */

import type { AccessProvenanceStatus } from "./domains";

export const ACCESS_SOURCE_CLASSES = [
  "community_reported",
  "organisation_supplied",
  "assessor_measured",
  "sensor_observed",
  "ai_inferred",
  "independently_verified",
  "unknown",
  "expired",
] as const;

export type AccessSourceClass = (typeof ACCESS_SOURCE_CLASSES)[number];

export const ACCESS_OBSERVATION_SOURCE_TYPES = [
  "trained_assessor",
  "venue",
  "community",
  "operator",
  "system",
  "synthetic",
  "sensor",
  "ai",
] as const;

export type AccessObservationSourceType =
  (typeof ACCESS_OBSERVATION_SOURCE_TYPES)[number];

export type ProvenanceDisplay = {
  sourceClass: AccessSourceClass;
  verificationStatus: AccessProvenanceStatus;
  /** Human-readable; never claims verified for AI-inferred. */
  displayLabel: string;
  /** True when the assertion must not be treated as verified fact. */
  unverified: boolean;
  /** Unknown ≠ inaccessible. */
  unknownNotInaccessible: true;
  aiInferred: boolean;
};

const SOURCE_CLASS_LABELS: Record<AccessSourceClass, string> = {
  community_reported: "Community reported",
  organisation_supplied: "Organisation supplied",
  assessor_measured: "Assessor measured",
  sensor_observed: "Sensor observed",
  ai_inferred: "AI inferred — unverified",
  independently_verified: "Independently verified",
  unknown: "Unknown",
  expired: "Expired",
};

/** Map intake source type → portfolio source class. */
export function sourceTypeToSourceClass(
  sourceType: AccessObservationSourceType,
  evidenceKinds: string[] = [],
): AccessSourceClass {
  if (
    sourceType === "ai" ||
    evidenceKinds.includes("ai_inferred") ||
    evidenceKinds.includes("computer_vision")
  ) {
    return "ai_inferred";
  }
  switch (sourceType) {
    case "community":
      return "community_reported";
    case "venue":
    case "operator":
      return "organisation_supplied";
    case "trained_assessor":
      return "assessor_measured";
    case "sensor":
      return "sensor_observed";
    case "synthetic":
      return "unknown";
    case "system":
      return evidenceKinds.includes("independently_verified")
        ? "independently_verified"
        : "unknown";
    default: {
      const _exhaustive: never = sourceType;
      return _exhaustive;
    }
  }
}

/**
 * Resolve persisted verification status for a new observation.
 * AI-inferred and unknown sources may never land as `verified`.
 */
export function resolveCreateVerificationStatus(input: {
  sourceClass: AccessSourceClass;
  requestedStatus?: AccessProvenanceStatus;
}): AccessProvenanceStatus {
  const { sourceClass, requestedStatus } = input;

  if (sourceClass === "ai_inferred") {
    return "observed";
  }
  if (sourceClass === "unknown") {
    return "unknown";
  }
  if (sourceClass === "independently_verified") {
    return "verified";
  }
  if (sourceClass === "community_reported") {
    return "community_reported";
  }
  if (sourceClass === "organisation_supplied") {
    return "venue_reported";
  }
  if (sourceClass === "assessor_measured") {
    return requestedStatus === "verified" ? "verified" : "observed";
  }
  if (sourceClass === "sensor_observed") {
    return "observed";
  }
  if (sourceClass === "expired") {
    return "outdated";
  }

  return requestedStatus ?? "unknown";
}

export function buildProvenanceDisplay(input: {
  sourceType: AccessObservationSourceType;
  evidenceKinds: string[];
  verificationStatus: AccessProvenanceStatus;
  freshnessExpired: boolean;
}): ProvenanceDisplay {
  let sourceClass = sourceTypeToSourceClass(input.sourceType, input.evidenceKinds);
  if (input.freshnessExpired) {
    sourceClass = "expired";
  }
  if (input.verificationStatus === "disputed") {
    return {
      sourceClass,
      verificationStatus: "disputed",
      displayLabel: `${SOURCE_CLASS_LABELS[sourceClass]} (disputed)`,
      unverified: true,
      unknownNotInaccessible: true,
      aiInferred: sourceClass === "ai_inferred",
    };
  }

  const aiInferred = sourceClass === "ai_inferred";
  const unverified =
    aiInferred ||
    sourceClass === "unknown" ||
    sourceClass === "expired" ||
    sourceClass === "community_reported" ||
    input.verificationStatus === "unknown" ||
    input.verificationStatus === "outdated" ||
    input.verificationStatus === "community_reported" ||
    input.verificationStatus === "venue_reported" ||
    input.verificationStatus === "observed";

  return {
    sourceClass,
    verificationStatus: input.freshnessExpired
      ? "outdated"
      : input.verificationStatus,
    displayLabel: SOURCE_CLASS_LABELS[sourceClass],
    unverified: sourceClass === "independently_verified" ? false : unverified,
    unknownNotInaccessible: true,
    aiInferred,
  };
}

/** Reject attempts to store AI output as verified. */
export function assertAiCannotBeVerified(input: {
  sourceType: AccessObservationSourceType;
  evidenceKinds: string[];
  verificationStatus?: AccessProvenanceStatus;
}): void {
  const sourceClass = sourceTypeToSourceClass(input.sourceType, input.evidenceKinds);
  if (
    sourceClass === "ai_inferred" &&
    (input.verificationStatus === "verified" ||
      input.evidenceKinds.includes("independently_verified"))
  ) {
    throw new Error(
      "AI-inferred observations cannot be stored as independently verified",
    );
  }
}
