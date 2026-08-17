/**
 * Accountability ledger types — proofs and references only.
 * Do NOT store participant names, NDIS numbers, addresses, or case note content.
 */

export type LedgerEventType =
  | "service_event_confirmed"
  | "consent_granted"
  | "consent_withdrawn"
  | "invoice_validated"
  | "evidence_pack_created"
  | "incident_recorded"
  | "record_correction"
  | "daily_anchor"
  | "copilot_draft_created"
  | "copilot_action_confirmed";

export type LedgerSubjectType =
  | "service_event"
  | "consent"
  | "invoice"
  | "evidence_pack"
  | "incident"
  | "participant_profile"
  | "draft_record";

export type LedgerActorRole =
  | "participant"
  | "nominee"
  | "worker"
  | "coordinator"
  | "plan_manager"
  | "provider_admin"
  | "system"
  | "copilot";

/** Privacy-safe ledger event — hashes and opaque references only. */
export type LedgerEvent = {
  id: string;
  type: LedgerEventType;
  subjectType: LedgerSubjectType;
  /** Opaque reference to PRMS record — not PII. */
  subjectRef: string;
  participantRef: string;
  actorRole: LedgerActorRole;
  /** SHA-256 hex of canonical payload — not raw payload with PII. */
  payloadHash: string;
  previousEventHash: string | null;
  eventHash: string;
  createdAt: string;
  attestationStatus: "none" | "pending" | "attested";
};

export type Attestation = {
  id: string;
  ledgerEventId: string;
  attestedByRole: LedgerActorRole;
  attestedAt: string;
  attestationHash: string;
};

export type LedgerAnchor = {
  id: string;
  anchorDate: string;
  rootHash: string;
  eventCount: number;
  status: "pending" | "anchored";
};
