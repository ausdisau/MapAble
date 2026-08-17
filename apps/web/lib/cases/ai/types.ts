import type {
  CaseAIInsightKind,
  CaseCategory,
  CasePriority,
  CaseRiskLevel,
  CaseStatus,
} from "@prisma/client";

/**
 * Minimal projection of a Case that the AI engine works on. Keeping this
 * decoupled from Prisma row shapes lets us unit-test the engine with
 * plain objects and swap the underlying ORM later.
 */
export interface CaseSnapshot {
  id: string;
  reference: string;
  title: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  category: CaseCategory;
  riskLevel: CaseRiskLevel;
  openedAt: Date;
  dueAt: Date | null;
  closedAt: Date | null;
  participantId: string | null;
  assignedToId: string | null;
  notes: CaseNoteSnapshot[];
  tasks: CaseTaskSnapshot[];
  /** Tags or goals stored on the case as plain strings. */
  tags: string[];
}

export interface CaseNoteSnapshot {
  id: string;
  body: string;
  createdAt: Date;
  pinned: boolean;
}

export interface CaseTaskSnapshot {
  id: string;
  title: string;
  status: string;
  dueAt: Date | null;
  completedAt: Date | null;
}

export interface AIRiskAssessment {
  level: CaseRiskLevel;
  score: number;
  signals: string[];
  rationale: string;
}

export interface AISummary {
  text: string;
  highlights: string[];
}

export interface AINextAction {
  title: string;
  reason: string;
  priority: CasePriority;
  dueInDays: number | null;
}

export interface AISearchHit {
  caseId: string;
  reference: string;
  title: string;
  score: number;
  matchedTerms: string[];
}

/**
 * Pluggable engine contract. The default implementation in
 * `lib/cases/ai/engine.ts` is deterministic and rule-based; production
 * deployments may swap a hosted LLM that implements the same shape.
 */
export interface CaseAIEngine {
  /** Stable identifier persisted alongside insights for audit trails. */
  readonly id: string;
  /** Confidence ceiling for this engine; humans must acknowledge insights. */
  readonly maxConfidence: number;
  classifyRisk(input: CaseSnapshot): AIRiskAssessment;
  summarise(input: CaseSnapshot): AISummary;
  nextActions(input: CaseSnapshot): AINextAction[];
  search(query: string, candidates: CaseSnapshot[]): AISearchHit[];
}

export interface PersistedInsight {
  kind: CaseAIInsightKind;
  engine: string;
  summary: string;
  detailJson: unknown;
  confidence: number;
  requiresReview: boolean;
}
