export type AccessEvidenceClass =
  | "synthetic_fixture"
  | "model_candidate"
  | "participant_observation"
  | "community_observation"
  | "venue_declaration"
  | "mapper_observation"
  | "device_assisted_estimate"
  | "manual_measurement"
  | "professional_measurement"
  | "operational_sensor"
  | "authoritative_public_source"
  | "moderated_claim"
  | "independently_verified_claim";

export type EvidenceClassPolicy = {
  class: AccessEvidenceClass;
  permittedUse: string[];
  publicDisplay: "allowed" | "redacted" | "never";
  personalFitUse: "hard_ok" | "soft_only" | "insufficient_alone" | "never";
  defaultExpiryHintDays: number | null;
  requiresCorroboration: boolean;
  moderationRequired: boolean;
  limitations: string[];
};

export const EVIDENCE_CLASS_POLICIES: Record<AccessEvidenceClass, EvidenceClassPolicy> = {
  synthetic_fixture: {
    class: "synthetic_fixture",
    permittedUse: ["tests", "demos", "shadow_evaluation"],
    publicDisplay: "allowed",
    personalFitUse: "soft_only",
    defaultExpiryHintDays: null,
    requiresCorroboration: false,
    moderationRequired: false,
    limitations: ["Not real-world evidence", "Must be labelled synthetic"],
  },
  model_candidate: {
    class: "model_candidate",
    permittedUse: ["change_review_input", "participant_private_review"],
    publicDisplay: "never",
    personalFitUse: "never",
    defaultExpiryHintDays: 1,
    requiresCorroboration: true,
    moderationRequired: true,
    limitations: ["Not verified evidence", "Not a certified measurement"],
  },
  participant_observation: {
    class: "participant_observation",
    permittedUse: ["private_memory", "optional_contribution"],
    publicDisplay: "never",
    personalFitUse: "soft_only",
    defaultExpiryHintDays: 90,
    requiresCorroboration: false,
    moderationRequired: false,
    limitations: ["Private by default", "Not automatic public evidence"],
  },
  community_observation: {
    class: "community_observation",
    permittedUse: ["map_display_after_moderation", "soft_fit"],
    publicDisplay: "redacted",
    personalFitUse: "insufficient_alone",
    defaultExpiryHintDays: 180,
    requiresCorroboration: true,
    moderationRequired: true,
    limitations: ["Distinct from assessor evidence"],
  },
  venue_declaration: {
    class: "venue_declaration",
    permittedUse: ["display", "soft_fit"],
    publicDisplay: "allowed",
    personalFitUse: "insufficient_alone",
    defaultExpiryHintDays: 180,
    requiresCorroboration: true,
    moderationRequired: false,
    limitations: ["Distinct from independent verification"],
  },
  mapper_observation: {
    class: "mapper_observation",
    permittedUse: ["display", "soft_fit", "hard_fit_with_policy"],
    publicDisplay: "allowed",
    personalFitUse: "soft_only",
    defaultExpiryHintDays: 365,
    requiresCorroboration: false,
    moderationRequired: true,
    limitations: ["Training level must be recorded"],
  },
  device_assisted_estimate: {
    class: "device_assisted_estimate",
    permittedUse: ["provisional_geometry", "change_candidates"],
    publicDisplay: "never",
    personalFitUse: "never",
    defaultExpiryHintDays: 7,
    requiresCorroboration: true,
    moderationRequired: true,
    limitations: ["Provisional", "Not professional measurement"],
  },
  manual_measurement: {
    class: "manual_measurement",
    permittedUse: ["hard_fit", "display"],
    publicDisplay: "allowed",
    personalFitUse: "hard_ok",
    defaultExpiryHintDays: 730,
    requiresCorroboration: false,
    moderationRequired: false,
    limitations: ["Method and tool must be recorded"],
  },
  professional_measurement: {
    class: "professional_measurement",
    permittedUse: ["hard_fit", "accreditation_evidence", "display"],
    publicDisplay: "allowed",
    personalFitUse: "hard_ok",
    defaultExpiryHintDays: 1095,
    requiresCorroboration: false,
    moderationRequired: false,
    limitations: ["Assessor credentials required", "Not automatic legal compliance"],
  },
  operational_sensor: {
    class: "operational_sensor",
    permittedUse: ["temporal_state", "hard_fit_when_fresh"],
    publicDisplay: "allowed",
    personalFitUse: "hard_ok",
    defaultExpiryHintDays: 1,
    requiresCorroboration: false,
    moderationRequired: false,
    limitations: ["Expires quickly", "Sensor outage → unknown"],
  },
  authoritative_public_source: {
    class: "authoritative_public_source",
    permittedUse: ["display", "soft_fit", "civic_projection"],
    publicDisplay: "allowed",
    personalFitUse: "soft_only",
    defaultExpiryHintDays: 365,
    requiresCorroboration: false,
    moderationRequired: false,
    limitations: ["Source version required"],
  },
  moderated_claim: {
    class: "moderated_claim",
    permittedUse: ["display", "soft_fit"],
    publicDisplay: "allowed",
    personalFitUse: "soft_only",
    defaultExpiryHintDays: 180,
    requiresCorroboration: false,
    moderationRequired: true,
    limitations: ["Moderation decision must be auditable"],
  },
  independently_verified_claim: {
    class: "independently_verified_claim",
    permittedUse: ["hard_fit", "display", "accreditation_overlay"],
    publicDisplay: "allowed",
    personalFitUse: "hard_ok",
    defaultExpiryHintDays: 730,
    requiresCorroboration: false,
    moderationRequired: false,
    limitations: ["Verification method and verifier identity required"],
  },
};
