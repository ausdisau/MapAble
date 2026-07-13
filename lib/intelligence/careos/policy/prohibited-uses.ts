export const PROHIBITED_CAREOS_CAPABILITIES = [
  "ndis_eligibility_determination",
  "support_or_funding_denial",
  "clinical_diagnosis",
  "treatment_prescription",
  "medical_symptom_interpretation",
  "decision_making_capacity_determination",
  "restrictive_practice_recommendation",
  "emotion_recognition",
  "deception_detection",
  "disability_severity_scoring",
  "participant_risk_scoring",
  "autonomous_employment_rejection",
  "autonomous_worker_discipline",
  "autonomous_complaint_resolution",
  "emergency_dispatch_or_interpretation",
  "autonomous_invoice_rejection",
  "autonomous_payment_release",
  "autonomous_claim_submission",
  "unapproved_sensitive_data_disclosure",
  "agent_direct_database_write",
  "hidden_cross_module_participant_reuse",
] as const;

export type ProhibitedCareOSCapability =
  (typeof PROHIBITED_CAREOS_CAPABILITIES)[number];

export function isProhibitedCareOSCapability(
  capability: string
): capability is ProhibitedCareOSCapability {
  return (PROHIBITED_CAREOS_CAPABILITIES as readonly string[]).includes(capability);
}

export function assertCareOSCapabilityAllowed(capability: string): void {
  if (isProhibitedCareOSCapability(capability)) {
    throw new CareOSPolicyError(
      "PROHIBITED_ACTION",
      "This CareOS capability is prohibited and cannot be executed."
    );
  }
}

export class CareOSPolicyError extends Error {
  constructor(
    public readonly code:
      | "PROHIBITED_ACTION"
      | "AUTHORITY_LEVEL_DENIED"
      | "WRITE_ACTION_DENIED",
    message: string
  ) {
    super(message);
    this.name = "CareOSPolicyError";
  }
}
