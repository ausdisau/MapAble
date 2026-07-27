/**
 * O1 — Single CareOS / MapAble AI prohibited-use registry.
 * All consequential automation must fail closed against this list.
 */

export const UNIFIED_PROHIBITED_USES = [
  "ndis_eligibility_determination",
  "automated_support_eligibility",
  "support_or_funding_denial",
  "clinical_diagnosis",
  "clinical_diagnosis_or_prescribing",
  "treatment_prescription",
  "medical_symptom_interpretation",
  "decision_making_capacity_determination",
  "restrictive_practice_recommendation",
  "emotion_recognition",
  "deception_detection",
  "emotion_or_deception_recognition",
  "disability_severity_scoring",
  "participant_risk_scoring",
  "participant_worthiness_scoring",
  "autonomous_employment_rejection",
  "autonomous_worker_discipline",
  "autonomous_complaint_resolution",
  "emergency_dispatch_or_interpretation",
  "autonomous_invoice_rejection",
  "autonomous_payment_release",
  "autonomous_claim_submission",
  "unapproved_payment_or_claim_submission",
  "unapproved_booking_or_roster_change",
  "unapproved_sensitive_data_disclosure",
  "agent_direct_database_write",
  "hidden_cross_module_participant_reuse",
  "automatic_provider_or_worker_selection",
  "physical_at_actuation",
] as const;

export type UnifiedProhibitedUse = (typeof UNIFIED_PROHIBITED_USES)[number];

export function isUnifiedProhibitedUse(
  capability: string,
): capability is UnifiedProhibitedUse {
  return (UNIFIED_PROHIBITED_USES as readonly string[]).includes(capability);
}

export function assertUnifiedCapabilityAllowed(capability: string): void {
  if (isUnifiedProhibitedUse(capability)) {
    throw new Error(`CAREOS_PROHIBITED_USE:${capability}`);
  }
}

/** Canonical flag namespace for CareOS product surfaces (O1). */
export const CAREOS_FLAG_NAMESPACE = "MAPABLE_CAREOS_" as const;
