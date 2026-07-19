import { createHash, randomUUID } from "crypto";

/**
 * Outcomes and Impact Ledger — no participant success scores, no league tables.
 */

export type OutcomeObservationSource = "participant" | "provider";

export type OutcomeRecord = {
  receiptId: string;
  participantId: string;
  goalStatement: string;
  serviceEvidenceRefs: string[];
  participantObservation?: string;
  providerObservation?: string;
  disagreement?: string;
  unresolvedIssues: string[];
  burdenNotes?: string;
  recoveryRefs: string[];
  finalOutcome?: string;
  participantDeclinedReview: boolean;
  createdAt: string;
  integrityHash: string;
};

export function issueOutcomeReceipt(input: {
  participantId: string;
  goalStatement: string;
  serviceEvidenceRefs?: string[];
  participantObservation?: string;
  providerObservation?: string;
  disagreement?: string;
  unresolvedIssues?: string[];
  burdenNotes?: string;
  recoveryRefs?: string[];
  finalOutcome?: string;
  participantDeclinedReview?: boolean;
}): OutcomeRecord {
  const createdAt = new Date().toISOString();
  const base = {
    receiptId: randomUUID(),
    participantId: input.participantId,
    goalStatement: input.goalStatement.trim(),
    serviceEvidenceRefs: input.serviceEvidenceRefs ?? [],
    participantObservation: input.participantObservation,
    providerObservation: input.providerObservation,
    disagreement: input.disagreement,
    unresolvedIssues: input.unresolvedIssues ?? [],
    burdenNotes: input.burdenNotes,
    recoveryRefs: input.recoveryRefs ?? [],
    finalOutcome: input.finalOutcome,
    participantDeclinedReview: Boolean(input.participantDeclinedReview),
    createdAt,
  };
  const integrityHash = createHash("sha256")
    .update(JSON.stringify(base))
    .digest("hex");
  return { ...base, integrityHash };
}
