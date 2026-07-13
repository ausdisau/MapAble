export const MAPABLE_PROHIBITED_AI_USES = [
  "automated_support_eligibility",
  "clinical_diagnosis_or_prescribing",
  "emotion_or_deception_recognition",
  "disability_severity_scoring",
  "autonomous_employment_rejection",
  "unapproved_booking_or_roster_change",
  "unapproved_payment_or_claim_submission",
  "unapproved_sensitive_data_disclosure",
] as const;

export type MapAbleProhibitedAiUse =
  (typeof MAPABLE_PROHIBITED_AI_USES)[number];

export function assertPermittedAiUse(use: string) {
  if ((MAPABLE_PROHIBITED_AI_USES as readonly string[]).includes(use)) {
    throw new Error(`MAPABLE_AI_USE_PROHIBITED:${use}`);
  }
}
