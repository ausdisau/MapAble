import type {
  DataClass,
  OutputProvenance,
} from "@/lib/ai/platform/types/classification";

export type EvidenceEnvelope = {
  sourceEntityType: string;
  sourceEntityId: string;
  sourceVersion: string | null;
  organisationScope: string | null;
  participantScope: string | null;
  consentOrAuthorityBasis: string;
  purpose: string;
  dataClassification: DataClass;
  freshness: "fresh" | "stale" | "unknown";
  provenance: OutputProvenance;
  disputed: boolean;
  redactionState: "none" | "partial" | "full";
  permittedAudience: string[];
  retrievalTimestamp: string;
  citationLabel: string;
};

export type GroundedAnswerPart = {
  text: string;
  provenance: OutputProvenance;
  citations: EvidenceEnvelope[];
};

export type GroundedAnswer = {
  directResponse: string;
  parts: GroundedAnswerPart[];
  confirmed: string[];
  unknown: string[];
  disputed: string[];
  suggestedNextQuestions: string[];
  actionTaken: false;
};

/** Generated answers must not flatten conflicting accounts into one truth. */
export function separateConflictingAccounts(
  parts: GroundedAnswerPart[]
): { byProvenance: Record<string, string[]>; hasConflict: boolean } {
  const byProvenance: Record<string, string[]> = {};
  for (const part of parts) {
    const key = part.provenance;
    byProvenance[key] ??= [];
    byProvenance[key].push(part.text);
  }
  const accountKeys = [
    "participant_report",
    "provider_report",
    "worker_note",
    "system_record",
  ];
  const present = accountKeys.filter((k) => (byProvenance[k]?.length ?? 0) > 0);
  return { byProvenance, hasConflict: present.length > 1 };
}
