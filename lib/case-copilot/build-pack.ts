import { getCaseAIEngine } from "@/lib/cases/ai/engine";
import type { CaseSnapshot } from "@/lib/cases/ai/types";
import { caseCopilotConfig } from "@/lib/config/case-copilot";

import type {
  CaseCopilotPack,
  CaseSourceKind,
  CitedChronologyItem,
} from "./types";

const PROHIBITED = [
  "alter_case_status",
  "close_case",
  "determine_allegation",
  "contact_external_party",
  "determine_reportability",
  "decide_complaint",
  "recommend_restrictive_practice",
] as const;

function classifyNoteSource(body: string): CaseSourceKind {
  if (/^participant\s*:/i.test(body) || /participant says/i.test(body)) {
    return "participant_says";
  }
  if (/^provider\s*:/i.test(body) || /provider says/i.test(body)) {
    return "provider_says";
  }
  if (/^worker\s*:/i.test(body) || /worker note/i.test(body)) {
    return "worker_note_says";
  }
  return "worker_note_says";
}

/**
 * Case Copilot pack — extends deterministic case AI without granting case authority.
 */
export function buildCaseCopilotPack(
  snapshot: CaseSnapshot,
  previousSnapshot?: CaseSnapshot | null
): CaseCopilotPack | { disabled: true; reason: string } {
  if (!caseCopilotConfig.enabled) {
    return { disabled: true, reason: "MAPABLE_CASE_COPILOT_ENABLED is false" };
  }

  const engine = getCaseAIEngine();
  const risk = engine.classifyRisk(snapshot);
  const summary = engine.summarise(snapshot);
  const actions = engine.nextActions(snapshot);

  const openedItem: CitedChronologyItem = {
    at: snapshot.openedAt.toISOString(),
    source: "system_record_shows",
    text: `Case ${snapshot.reference} opened: ${snapshot.title}`,
    citationId: `case:${snapshot.id}:opened`,
    disputed: false,
  };
  const noteItems: CitedChronologyItem[] = snapshot.notes.map((n) => ({
    at: n.createdAt.toISOString(),
    source: classifyNoteSource(n.body),
    text: n.body,
    citationId: `note:${n.id}`,
    disputed: /dispute|disagree|conflict/i.test(n.body),
  }));
  const chronology: CitedChronologyItem[] = [openedItem, ...noteItems].sort(
    (a, b) => a.at.localeCompare(b.at)
  );

  const sourceSeparatedSummary: Record<CaseSourceKind, string[]> = {
    participant_says: [],
    provider_says: [],
    worker_note_says: [],
    system_record_shows: [summary.text],
    mapable_cannot_determine: [],
  };

  for (const item of chronology) {
    sourceSeparatedSummary[item.source].push(item.text);
  }

  const participantTexts = sourceSeparatedSummary.participant_says;
  const providerTexts = sourceSeparatedSummary.provider_says;
  const conflictingAccounts: CaseCopilotPack["conflictingAccounts"] = [];
  if (participantTexts.length && providerTexts.length) {
    conflictingAccounts.push({
      topic: "Account of events",
      accounts: [
        `Participant says: ${participantTexts.join(" ")}`,
        `Provider says: ${providerTexts.join(" ")}`,
      ],
    });
    sourceSeparatedSummary.mapable_cannot_determine.push(
      "Participant and provider accounts differ — MapAble cannot determine a single narrative."
    );
  }

  const unresolvedActions = actions.map((a, i) => ({
    title: a.title,
    reason: a.reason,
    citationId: `action:${i}:${snapshot.id}`,
  }));

  const deadlines = [
    ...(snapshot.dueAt
      ? [
          {
            title: "Case due date",
            dueAt: snapshot.dueAt.toISOString(),
            citationId: `case:${snapshot.id}:due`,
          },
        ]
      : []),
    ...snapshot.tasks
      .filter((t) => t.status !== "completed")
      .map((t) => ({
        title: t.title,
        dueAt: t.dueAt?.toISOString() ?? null,
        citationId: `task:${t.id}`,
      })),
  ];

  const evidenceGaps: string[] = [];
  if (!snapshot.participantId) evidenceGaps.push("Participant link missing");
  if (snapshot.notes.length === 0) evidenceGaps.push("No case notes yet");
  if (!snapshot.dueAt) evidenceGaps.push("No case due date set");
  if (conflictingAccounts.length) {
    evidenceGaps.push("Conflicting accounts require human reconciliation");
  }

  let whatChangedSummary = "No prior snapshot provided.";
  if (previousSnapshot) {
    const parts: string[] = [];
    if (previousSnapshot.status !== snapshot.status) {
      parts.push(`Status ${previousSnapshot.status} → ${snapshot.status}`);
    }
    if (previousSnapshot.notes.length !== snapshot.notes.length) {
      parts.push(
        `Notes ${previousSnapshot.notes.length} → ${snapshot.notes.length}`
      );
    }
    whatChangedSummary = parts.length ? parts.join("; ") : "No material field changes detected.";
  }

  return {
    authorityCeiling: "DRAFT_ONLY",
    actionTaken: false,
    chronology,
    sourceSeparatedSummary,
    unresolvedActions,
    deadlines,
    evidenceGaps,
    conflictingAccounts,
    handoverDraft: [
      `Handover draft for ${snapshot.reference} (editable, not sent).`,
      `Title: ${snapshot.title}`,
      `Deterministic risk (separate from narrative): ${risk.level} — ${risk.rationale}`,
      `Unresolved: ${unresolvedActions.map((a) => a.title).join("; ") || "none"}`,
      conflictingAccounts.length
        ? "Sources disagree — do not collapse into one story."
        : "No conflicting accounts detected from tagged notes.",
    ].join("\n"),
    participantUpdateDraft: [
      `Update draft for participant (editable, not sent).`,
      `About your case ${snapshot.reference}:`,
      summary.highlights[0] ?? summary.text,
      "Please tell us if anything is wrong or missing.",
    ].join("\n"),
    whatChangedSummary,
    deterministicRisk: {
      level: risk.level,
      rationale: risk.rationale,
      separatedFromNarrative: true,
    },
    humanReviewRequired: true,
    correctionWorkflow: {
      state: "suggestion_generated",
      instructions:
        "Participant or authorised human may request corrections. Suggestions are never auto-approved.",
    },
  };
}

export function caseCopilotProhibitedActions(): readonly string[] {
  return PROHIBITED;
}
