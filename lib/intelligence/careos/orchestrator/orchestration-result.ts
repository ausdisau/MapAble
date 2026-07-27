export type CareOSEvidence = {
  sourceType:
    | "authoritative_mapable_record"
    | "verified_credential"
    | "professional_accessibility_assessment"
    | "mapable_accreditation_record"
    | "provider_claim"
    | "community_report"
    | "public_transport_data"
    | "participant_confirmed_preference"
    | "ai_inference";
  sourceDate?: string;
  summary: string;
  verified: boolean;
};

export type CareOSMissionResult = {
  understoodGoal: string;
  recommendations: Array<{
    id: string;
    title: string;
    summary: string;
    carePlan?: { workerName: string; organisationId: string };
    transportPlan?: { vehicleName: string; organisationId: string };
    evidence: CareOSEvidence[];
    confidence: "high" | "medium" | "low";
    uncertainty: string[];
    hardConstraintsSatisfied: boolean;
  }>;
  missingInformation: string[];
  consentRequired: string[];
  humanReviewRequired: boolean;
  nextActions: Array<{ label: string; action: "review" | "edit" | "reject" | "use_standard_form" }>;
  nonAIPath: { label: string; href?: string; phone?: string };
  notice: "No booking has been made.";
};
