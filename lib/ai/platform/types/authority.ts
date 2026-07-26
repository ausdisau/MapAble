/** Authority ceilings — AI must never exceed the registered ceiling. */

export const AUTHORITY_CEILINGS = [
  "READ_ONLY_EXPLAIN",
  "DRAFT_ONLY",
  "SUGGEST_WITH_HUMAN_REVIEW",
  "SUGGEST_WITH_PARTICIPANT_APPROVAL",
  "DETERMINISTIC_EXECUTE_VIA_SERVICE",
  "NO_OPERATIONAL_AUTHORITY",
] as const;

export type AuthorityCeiling = (typeof AUTHORITY_CEILINGS)[number];

export const PROHIBITED_AUTONOMOUS_ACTIONS = [
  "approve_ndis_claim",
  "approve_or_pay_invoice",
  "alter_funding_route",
  "accept_service_agreement",
  "assign_support_worker",
  "confirm_transport",
  "alter_consent",
  "create_legal_delegation",
  "determine_ndis_eligibility",
  "definitive_legal_conclusion",
  "clinical_decision",
  "determine_incident_reportability",
  "substantiate_or_dismiss_allegation",
  "close_incident_or_complaint",
  "approve_restrictive_practice",
  "declare_worker_competent",
  "issue_regulatory_or_accessibility_certification",
  "contact_emergency_services",
  "infer_goals_from_diagnosis",
  "infer_consent_from_behaviour",
  "infer_capacity_from_communication_style",
  "infer_loneliness_compliance_motivation_or_risk_from_engagement",
  "modify_own_policies_prompts_tools_or_authority",
  "publish_participant_information",
  "retain_hidden_long_term_memory",
  "execute_instructions_from_retrieved_documents",
] as const;

export type ProhibitedAutonomousAction =
  (typeof PROHIBITED_AUTONOMOUS_ACTIONS)[number];
