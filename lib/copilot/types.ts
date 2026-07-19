import type { ConsentScope, DraftPrmsRecord } from "@/lib/prms/types";
import type { AppliedSearchFields } from "@/lib/search/apply-interpretation";
import type { SearchInterpretation } from "@/types/search";

export type CopilotIntentType =
  | "support"
  | "transport"
  | "combined"
  | "jobs"
  | "places"
  | "provider_finder"
  | "ndis"
  | "billing"
  | "incident"
  | "health"
  | "unknown";

export type CopilotAskContext = "default" | "provider_finder";

export type CopilotMode =
  | "All"
  | "Support"
  | "Transport"
  | "Places"
  | "Jobs"
  | "Help"
  | "NDIS";

export type CopilotIntent = {
  type: CopilotIntentType;
  confidence: number;
  filters: Record<string, unknown>;
  reason: string;
};

export type CopilotActionType =
  | "CREATE_DRAFT_SERVICE_EVENT"
  | "CHECK_CONSENT"
  | "CHECK_NDIS_PLAN"
  | "INVOICE_REVIEW"
  | "EVIDENCE_PACK_REVIEW"
  | "PLAN_SUMMARY"
  | "BUDGET_EXPLANATION"
  | "INCIDENT_REPORT"
  | "SAFETY_ESCALATION"
  | "EMPLOYMENT_SUPPORT"
  | "OPEN_PROVIDER_SEARCH"
  | "GUIDANCE_ONLY";

export type CopilotFinderPayload = {
  interpretation: SearchInterpretation;
  applied: AppliedSearchFields;
  searchParams: Record<string, string>;
  replyText: string;
};

/** NDIS directory row surfaced in Ask / agent responses (not MapAble-verified). */
export type CopilotProviderResult = {
  id: string;
  slug: string;
  name: string;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  locationLabel: string | null;
  registered: boolean;
  registrationGroups: string[];
  services: string[];
  phone: string | null;
  website: string | null;
};

export type CopilotAgentStatus = "complete" | "needs_clarification";

export type ClarificationSlot = "location" | "service" | "access" | "general";

export type ClarificationChoice = { label: string; value: string };

export type CopilotAgentMeta = {
  sessionId: string;
  turnIndex: number;
  status: CopilotAgentStatus;
  clarificationQuestion?: string;
  clarificationSlot?: ClarificationSlot;
  suggestedChoices?: ClarificationChoice[];
  filledSlots?: Partial<Record<ClarificationSlot, boolean>>;
  providerResults?: CopilotProviderResult[];
};

export type CopilotAction = {
  type: CopilotActionType;
  label: string;
  requiresConfirmation: boolean;
};

export type ConfirmationGateType =
  | "PARTICIPANT_CONFIRMATION"
  | "CONSENT_CONFIRMATION"
  | "HUMAN_REVIEW_IF_FLAGGED"
  | "FINANCE_REVIEW"
  | "SAFETY_REVIEW"
  | "HUMAN_APPROVAL";

export type ConfirmationGate = {
  type: ConfirmationGateType;
  title: string;
  explanation: string;
};

export type CopilotWarningLevel = "info" | "warning" | "urgent";

export type CopilotWarning = {
  level: CopilotWarningLevel;
  message: string;
};

export type CopilotRequest = {
  query: string;
  mode?: CopilotMode | string;
  participantId?: string;
  sessionId?: string;
};

export type CopilotContext = {
  participantId: string;
  profileCompletionPercent: number;
  accessNeeds: { id: string; label: string }[];
  mobilityAids: { id: string; label: string }[];
  communicationPreferences: { id: string; mode: string }[];
  planSummary: {
    status: string;
    fundingManagement: string;
    overallBudgetBand: string;
  };
  activeGoals: { id: string; summary: string }[];
  consentSummary: {
    grantedScopes: ConsentScope[];
    openConsentConflicts: ConsentScope[];
  };
  upcomingEvents: { id: string; title: string; scheduledAt: string }[];
  openRisks: { id: string; level: string; label: string }[];
  missingEvidence: string[];
};

export type CopilotPlanningInput = {
  query: string;
  mode: string;
  intent: CopilotIntent;
  context: CopilotContext | null;
  sessionId: string;
  participantId?: string;
};

export type CopilotActionPlan = {
  summary: string;
  plainLanguageAnswer: string;
  filters: Record<string, unknown>;
  actions: CopilotAction[];
  draftRecords: DraftPrmsRecord[];
  requiredConfirmations: ConfirmationGate[];
  warnings: CopilotWarning[];
  /** Top NDIS directory matches from live search (when available). */
  providerResults?: CopilotProviderResult[];
  agent?: CopilotAgentMeta;
  toolsCalled?: string[];
};

export type GuardrailInput = {
  planned: CopilotActionPlan;
  context: CopilotContext | null;
  participantId?: string;
};

export type CopilotAskResponse = {
  source: "mapable-copilot";
  intent: CopilotIntentType;
  confidence: number;
  summary: string;
  answer: string;
  filters: Record<string, unknown>;
  actions: CopilotAction[];
  draftRecords: DraftPrmsRecord[];
  requiredConfirmations: ConfirmationGate[];
  warnings: CopilotWarning[];
  blockedActions: CopilotAction[];
  /** Provider Finder NL search payload when applicable */
  finder?: CopilotFinderPayload;
  /** NDIS directory matches (serialisable). */
  results?: CopilotProviderResult[];
  suggestedPrompts?: string[];
  agent?: CopilotAgentMeta;
};
