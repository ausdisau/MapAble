function enabled(name: string) {
  return process.env[name] === "true";
}

/**
 * CareOS Phase 11 — Quality, Accreditation and Compliance Cloud.
 * Provider QMS with versioned standards, audits, policies/training, and
 * human-assessor-only provider accreditation.
 */
export const qualityAccreditationConfig = {
  qmsEnabled: enabled("MAPABLE_QUALITY_QMS_ENABLED"),
  providerAccreditationEnabled: enabled("MAPABLE_PROVIDER_ACCREDITATION_ENABLED"),
  /** Safety: CareOS must NOT auto-decide accreditation outcomes. */
  automaticAccreditationDecisionEnabled: false,
  /** Safety: CareOS must NOT derive provider scores from participant incidents. */
  participantIncidentToProviderScoreEnabled: false,
} as const;

export type QualityAccreditationConfig = typeof qualityAccreditationConfig;

export function ensureQualityQmsEnabled() {
  if (!qualityAccreditationConfig.qmsEnabled) {
    throw new Error("QUALITY_QMS_DISABLED");
  }
}

export function ensureProviderAccreditationEnabled() {
  if (!qualityAccreditationConfig.providerAccreditationEnabled) {
    throw new Error("PROVIDER_ACCREDITATION_DISABLED");
  }
}
