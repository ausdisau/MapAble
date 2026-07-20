/**
 * Participant-controlled Access Profile and presentation contracts.
 * Extends existing AccessibilityProfile / Communication Passport — not a new identity.
 */

export const ACCESS_PROFILE_FIELD_KEYS = [
  "preferredName",
  "language",
  "communicationMode",
  "plainLanguagePreference",
  "easyReadPreference",
  "oneQuestionAtATime",
  "informationDensity",
  "controlSize",
  "textSize",
  "lineSpacing",
  "colourContrastPreference",
  "reducedMotion",
  "screenReaderOptimisation",
  "switchAccessMode",
  "voiceControlMode",
  "keyboardOnlyMode",
  "aacFriendlyPhrasing",
  "preferredSymbols",
  "audioSynchronizedHighlighting",
  "responseTimeExtension",
  "timeoutWarningPreference",
  "notificationPreference",
  "supporterAssistancePreference",
  "preferredNavigationPattern",
  "familiarInterfaceVersion",
  "changeTolerance",
  "privacyMode",
] as const;

export type AccessProfileFieldKey = (typeof ACCESS_PROFILE_FIELD_KEYS)[number];

export const FIELD_SOURCES = [
  "participant",
  "assisted_onboarding",
  "imported_profile",
  "system_default",
] as const;

export type FieldSource = (typeof FIELD_SOURCES)[number];

/** Every preference field carries provenance and participant control metadata. */
export type AccessProfileField<T = unknown> = {
  key: AccessProfileFieldKey;
  value: T;
  source: FieldSource;
  participantApproved: boolean;
  effectiveAtIso: string;
  expiresAtIso: string | null;
  disclosureClass: "private" | "shareable_with_consent" | "worker_facing";
  version: number;
  correctedAtIso: string | null;
  revokedAtIso: string | null;
};

export type ParticipantAccessProfile = {
  participantId: string;
  tenantId: string;
  /** References canonical AccessibilityProfile.id when persisted — never a parallel User. */
  accessibilityProfileRef: string | null;
  version: number;
  fields: AccessProfileField[];
  updatedAtIso: string;
};

export const ADAPTIVE_MODES = [
  "standard",
  "plain_language",
  "easy_read_draft",
  "one_question_at_a_time",
  "low_information_density",
  "screen_reader_optimised",
  "switch_access",
  "voice_access",
  "aac_friendly",
  "large_target",
  "reduced_motion",
  "familiar_interface",
] as const;

export type AdaptiveMode = (typeof ADAPTIVE_MODES)[number];

export const INFORMATION_DENSITIES = [
  "low",
  "medium",
  "high",
] as const;

export type InformationDensity = (typeof INFORMATION_DENSITIES)[number];

export const FAMILIAR_INTERFACE_CHOICES = [
  "use_latest",
  "retain_familiar_layout",
  "preview_new_layout",
  "migrate_with_assistance",
] as const;

export type FamiliarInterfaceChoice =
  (typeof FAMILIAR_INTERFACE_CHOICES)[number];

export type FamiliarInterfaceState = {
  choice: FamiliarInterfaceChoice;
  frozenLayoutVersion: string | null;
  /** Security and compliance fixes still apply when frozen. */
  securityFixesAlwaysApply: true;
  previewExpiresAtIso: string | null;
};

export type PresentationPolicyInput = {
  route: string;
  component: string;
  profile: ParticipantAccessProfile | null;
  deviceCapability: {
    keyboard: boolean;
    screenReaderLikely: boolean;
    switchAccess: boolean;
    voiceControl: boolean;
    reducedMotionOs: boolean;
  };
  accessibilitySetting: {
    textZoomPercent: number;
    highContrast: boolean;
  };
  currentTask: string;
  dataSensitivity: "public" | "operational" | "sensitive" | "restricted";
  familiarInterface: FamiliarInterfaceState | null;
};

export type ContentRendition =
  | "standard"
  | "plain_language"
  | "easy_read_draft"
  | "aac_friendly";

export type PresentationPolicyOutput = {
  componentVariant: string;
  contentRendition: ContentRendition;
  activeModes: AdaptiveMode[];
  navigationMode: "standard" | "one_question" | "landmark_first";
  interactionTiming: {
    responseExtensionSeconds: number;
    timeoutWarning: boolean;
  };
  informationDensity: InformationDensity;
  controlSize: "standard" | "large";
  reducedMotion: boolean;
  fallback: string;
  explanation: string;
  /** Required legal/financial/clinical terms must remain present. */
  meaningPreservation: {
    requiredTermsRetained: true;
    optionsNotReorderedForPersuasion: true;
    noSilentPreferenceReset: true;
  };
};

export type SurfaceAdapterResult = {
  surface: string;
  policy: PresentationPolicyOutput | null;
  /** When flags are off, surfaces render unchanged. */
  applied: boolean;
};
