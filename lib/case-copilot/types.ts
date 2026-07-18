export type CaseSourceKind =
  | "participant_says"
  | "provider_says"
  | "worker_note_says"
  | "system_record_shows"
  | "mapable_cannot_determine";

export type CitedChronologyItem = {
  at: string;
  source: CaseSourceKind;
  text: string;
  citationId: string;
  disputed: boolean;
};

export type CaseCopilotPack = {
  authorityCeiling: "DRAFT_ONLY";
  actionTaken: false;
  chronology: CitedChronologyItem[];
  sourceSeparatedSummary: Record<CaseSourceKind, string[]>;
  unresolvedActions: { title: string; reason: string; citationId: string }[];
  deadlines: { title: string; dueAt: string | null; citationId: string }[];
  evidenceGaps: string[];
  conflictingAccounts: { topic: string; accounts: string[] }[];
  handoverDraft: string;
  participantUpdateDraft: string;
  whatChangedSummary: string;
  deterministicRisk: {
    level: string;
    rationale: string;
    separatedFromNarrative: true;
  };
  humanReviewRequired: true;
  correctionWorkflow: {
    state: "suggestion_generated";
    instructions: string;
  };
};
