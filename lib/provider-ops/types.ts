export type AttentionKind =
  | "essential_shift_unfilled"
  | "worker_credential_expiring"
  | "worker_readiness_blocked"
  | "transport_at_risk"
  | "equipment_repair_overdue"
  | "incident_deadline"
  | "complaint_deadline"
  | "handoff_unaccepted"
  | "rejected_invoice"
  | "unreconciled_payment"
  | "unresolved_continuity_case"
  | "communication_requirement_unacked"
  | "participant_outcome_review_due";

export type AttentionItem = {
  id: string;
  kind: AttentionKind;
  title: string;
  why: string;
  ownerLabel: string;
  /** Deep link into canonical writer UI — never a second writer. */
  deepLink: string;
  organisationId: string;
  deadlineAt?: string;
  severity: "critical" | "high" | "medium";
  /** Minimised — no free-text participant notes. */
  participantRef?: string;
  unresolvedConsequence: string;
};

export type AttentionQueue = {
  organisationId: string;
  generatedAt: string;
  items: AttentionItem[];
  readOnly: true;
};
