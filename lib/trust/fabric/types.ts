/**
 * Trust Fabric contracts — purpose-bound, explainable, challengeable access.
 * Field categories only; never raw secrets or model chain-of-thought.
 */

export const ACCESS_FIELD_CATEGORIES = [
  "communication_preferences",
  "cognitive_preferences",
  "mobility_needs",
  "sensory_preferences",
  "transport_requirements",
  "digital_preferences",
  "service_history_summary",
  "active_authority",
  "access_requirements",
  "billing_summary",
  "identity_contact",
  "other_support_profile",
] as const;

export type AccessFieldCategory = (typeof ACCESS_FIELD_CATEGORIES)[number];

export const AUTHORITY_SOURCES = [
  "consent",
  "organisation_membership",
  "break_glass",
  "participant_self",
  "system_synthetic",
] as const;

export type AuthoritySource = (typeof AUTHORITY_SOURCES)[number];

export const ACCESS_OUTCOMES = [
  "disclosed",
  "denied",
  "error",
  "challenged",
  "exported",
] as const;

export type AccessOutcome = (typeof ACCESS_OUTCOMES)[number];

export type PurposeBoundAccessReceiptInput = {
  actorUserId?: string | null;
  participantId: string;
  organisationId?: string | null;
  purpose: string;
  fieldCategories: AccessFieldCategory[];
  authoritySource: AuthoritySource;
  authorityRef?: string | null;
  consentRecordId?: string | null;
  expiresAt?: Date | null;
  correlationId?: string;
  outcome: AccessOutcome;
};

export type ParticipantAccessHistoryItem = {
  id: string;
  actorDisplayName: string;
  organisationName: string | null;
  purpose: string;
  fieldCategories: string[];
  authoritySource: string;
  authorityActive: boolean;
  expiresAt: string | null;
  outcome: string;
  challenged: boolean;
  createdAt: string;
  canChallenge: boolean;
  consentRecordId: string | null;
};

export type DecisionNoticeInput = {
  decision: string;
  responsibleSystem: string;
  reasonCodes: string[];
  evidenceRefs?: string[];
  unknowns?: string[];
  humanOwnerUserId?: string | null;
  participantId?: string | null;
  organisationId?: string | null;
  reviewPath: string;
  correctionPath: string;
  correlationId?: string;
};

export type DecisionNotice = {
  id: string;
  decision: string;
  responsibleSystem: string;
  reasonCodes: string[];
  evidenceRefs: string[];
  unknowns: string[];
  humanOwnerUserId: string | null;
  participantId: string | null;
  organisationId: string | null;
  reviewPath: string;
  correctionPath: string;
  correlationId: string;
  createdAt: string;
  /** Explicit honesty: never includes private model chain-of-thought. */
  includesModelChainOfThought: false;
};

export type TrustFabricExportBundle = {
  exportedAt: string;
  publicClaimState: "internal_alpha";
  participantId: string;
  communicationPassport: unknown | null;
  accessRequirements: unknown | null;
  activeAuthority: Array<{
    consentId: string;
    purpose: string;
    scope: string;
    status: string;
    expiryDate: string | null;
  }>;
  accessHistorySummaries: ParticipantAccessHistoryItem[];
  serviceHistorySummaries: Array<{
    kind: string;
    id: string;
    status: string;
    summary: string;
  }>;
  outcomeReceipts: Array<{
    note: string;
  }>;
};
