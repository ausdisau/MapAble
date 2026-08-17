/** PRMS domain types — source of truth for participant records. */

export type ActorType =
  | "participant"
  | "nominee"
  | "support_worker"
  | "transport_worker"
  | "support_coordinator"
  | "plan_manager"
  | "provider_manager"
  | "quality_lead"
  | "system";

export type ConsentScope =
  | "profile_sharing"
  | "transport_sharing"
  | "plan_management"
  | "support_coordination"
  | "family_nominee_access"
  | "medical_documents"
  | "employment_adjustments"
  | "billing_plan_manager"
  | "emergency_disclosure"
  | "research_opt_in";

export type ConsentStatus = "granted" | "denied" | "pending" | "withdrawn";

export type PrmsRecordType =
  | "PARTICIPANT_PROFILE"
  | "CONSENT_RECORD"
  | "SERVICE_AGREEMENT"
  | "SERVICE_EVENT"
  | "CARE_REQUEST"
  | "TRANSPORT_REQUEST"
  | "EMPLOYMENT_SUPPORT_RECORD"
  | "MEAL_SUPPORT_RECORD"
  | "SUPPORT_COORDINATION_NOTE"
  | "PLAN_MANAGEMENT_INVOICE"
  | "INCIDENT"
  | "COMPLAINT"
  | "PROGRESS_NOTE"
  | "DOCUMENT"
  | "INVOICE"
  | "EVIDENCE_PACK";

export type ServiceEventType =
  | "care"
  | "transport"
  | "care_transport_bundle"
  | "jobs"
  | "meals"
  | "support_coordination"
  | "plan_management"
  | "billing_evidence"
  | "incident_safety";

export type ServiceEventStatus =
  | "draft"
  | "needs_confirmation"
  | "needs_human_review"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export type EvidencePackType =
  | "invoice_review"
  | "plan_review"
  | "incident"
  | "audit"
  | "service_delivery";

export type BudgetBand = "healthy" | "watch" | "low" | "overspend_risk";

/** Profile fields may include disability/health — treat as privacy-sensitive. */
export type AccessNeed = {
  id: string;
  label: string;
  category: "mobility" | "sensory" | "communication" | "cognitive" | "other";
};

export type MobilityAid = {
  id: string;
  label: string;
  notes?: string;
};

export type CommunicationPreference = {
  id: string;
  mode: "plain_language" | "easy_read" | "visual" | "verbal" | "written" | "aac";
  detail?: string;
};

export type ParticipantProfileSummary = {
  participantId: string;
  preferredName: string;
  /** Masked identifier only in Co-Pilot context — never full NDIS number in UI summaries. */
  ndisNumberMasked: string;
  planStart?: string;
  planEnd?: string;
  fundingManagement: "self_managed" | "plan_managed" | "agency_managed" | "unknown";
  profileCompletionPercent: number;
  accessNeeds: AccessNeed[];
  mobilityAids: MobilityAid[];
  communicationPreferences: CommunicationPreference[];
  emergencyContactCount: number;
  hasNominee: boolean;
};

export type NdisPlanSummary = {
  planId: string;
  status: "active" | "ending_soon" | "expired" | "unknown";
  fundingManagement: ParticipantProfileSummary["fundingManagement"];
  categoryCount: number;
  /** Band only — not exact dollars in Co-Pilot context unless billing workflow. */
  overallBudgetBand: BudgetBand;
};

export type ParticipantGoal = {
  id: string;
  domain: string;
  summary: string;
  progressPercent?: number;
};

export type ConsentRecordSummary = {
  scope: ConsentScope;
  status: ConsentStatus;
  expiresAt?: string;
  lastUsedAt?: string;
};

export type ConsentSummary = {
  records: ConsentRecordSummary[];
  openConflicts: ConsentScope[];
};

export type ServiceEventSummary = {
  id: string;
  type: ServiceEventType;
  status: ServiceEventStatus;
  scheduledAt: string;
  title: string;
  consentStatus: ConsentStatus | "not_required";
  supportLogStatus: "missing" | "draft" | "signed";
  evidenceStatus: "none" | "partial" | "complete";
};

export type OpenRiskSummary = {
  id: string;
  level: "info" | "watch" | "urgent";
  label: string;
};

export type DraftPrmsRecord = {
  id?: string;
  type: PrmsRecordType;
  status: "draft" | "needs_confirmation" | "needs_human_review";
  participantId: string;
  payload: Record<string, unknown>;
};

export type OfficialPrmsRecord = Omit<DraftPrmsRecord, "status"> & {
  id: string;
  status: "confirmed" | "in_progress" | "completed" | "archived";
  confirmedAt: string;
  confirmedBy: ActorType;
};
