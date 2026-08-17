import { z } from "zod";

import { careRequestTypeSchema } from "@/lib/validation/care";

export const PIPELINE_VERSION = "care-support-transformer-v1";

export const careSupportTransformInputSchema = z.object({
  participantId: z.string().min(1).optional(),
  sessionId: z.string().min(1),
  message: z.string().min(1).max(5000),
  assessmentSignals: z.record(z.string(), z.unknown()).default({}),
  preferences: z.record(z.string(), z.unknown()).default({}),
});

export type CareSupportTransformInput = z.infer<
  typeof careSupportTransformInputSchema
>;

export type CareRequestTypeValue = z.infer<typeof careRequestTypeSchema>;

export type RiskSignal =
  | "manual_handling"
  | "medication_prompting"
  | "behaviour_support"
  | "safeguarding"
  | "clinical_diagnosis_language"
  | "ndis_eligibility_language";

export type CareIntakeResult = {
  normalizedMessage: string;
  inferredRequestType: CareRequestTypeValue;
  titleHint: string;
  schedulingHints: {
    preferredDate?: string;
    startTime?: string;
    endTime?: string;
    locationHint?: string;
  };
  riskSignals: RiskSignal[];
  linkedTransportRequired: boolean;
  accessNotesCandidate?: string;
  auditFlags: string[];
};

export type StructuredCareTask = {
  name: string;
  intensity: "standard" | "high";
  source: "message" | "assessment_signal";
};

export type CarePlanDraft = {
  status: "needs_confirmation";
  bookingStatus: "blocked_until_participant_confirmation";
  requestType: CareRequestTypeValue;
  title: string;
  description: string;
  preferredDate?: string;
  startTime?: string;
  endTime?: string;
  address?: string;
  suburb?: string;
  state?: string;
  accessRequirementsSummary?: string;
  linkedTransportRequired: boolean;
  shareAccessibility: boolean;
  shareAccessibilityConfirmed: boolean;
  tasks: StructuredCareTask[];
  autoAssignWorkers: false;
  autoFinalizeBooking: false;
};

export type WorkerCapabilityRequirement = {
  id: string;
  label: string;
  reason: string;
  required: boolean;
};

export type TransformCheckpointType =
  | "PARTICIPANT_CONFIRMATION"
  | "CONSENT_CONFIRMATION"
  | "HUMAN_REVIEW_IF_FLAGGED"
  | "SAFETY_REVIEW";

export type TransformCheckpoint = {
  id: string;
  type: TransformCheckpointType;
  title: string;
  explanation: string;
  requiredBeforeBooking: boolean;
};

export type GuardrailDecision = {
  allowed: boolean;
  autoAssignWorkers: false;
  autoFinalizeBooking: false;
  humanReviewRequired: boolean;
  personalCareConfirmationRequired: boolean;
  blockedReasons: string[];
  appliedRules: string[];
};

export type SupportJourneyNodeStatus = "pending" | "complete" | "blocked";

export type SupportJourneyNode = {
  id: string;
  type: string;
  label: string;
  status: SupportJourneyNodeStatus;
};

export type SupportJourneyEdge = {
  from: string;
  to: string;
};

export type SupportJourneyPatch = {
  version: 1;
  sessionId: string;
  nodes: SupportJourneyNode[];
  edges: SupportJourneyEdge[];
  pendingConfirmationGate: string | null;
};

export type AgentDecisionRecord = {
  agent: string;
  outcome: string;
  metadata?: Record<string, unknown>;
};

export type TransformAudit = {
  sessionId: string;
  transformId: string;
  timestamp: string;
  pipelineVersion: string;
  participantId: string | null;
  inputHash: string;
  agentDecisions: AgentDecisionRecord[];
  guardrailTriggers: string[];
  redactedFields: string[];
};

export type CareSupportTransformOutput = {
  participantFacingSummary: string;
  carePlanDraft: CarePlanDraft;
  supportJourneyPatch: SupportJourneyPatch;
  requiredCapabilities: WorkerCapabilityRequirement[];
  missingInformation: string[];
  guardrailDecision: GuardrailDecision;
  checkpoints: TransformCheckpoint[];
  audit: TransformAudit;
};

export type CareGuardrailInput = {
  intake: CareIntakeResult;
  carePlanDraft: CarePlanDraft;
  requiredCapabilities: WorkerCapabilityRequirement[];
  participantId?: string;
  preferences: Record<string, unknown>;
  sessionOnly: boolean;
};

export type CareGuardrailResult = {
  guardrailDecision: GuardrailDecision;
  checkpoints: TransformCheckpoint[];
  missingInformation: string[];
  carePlanDraft: CarePlanDraft;
  auditTriggers: string[];
  redactedFields: string[];
};
