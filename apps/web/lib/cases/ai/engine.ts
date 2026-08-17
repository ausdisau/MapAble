import { caseManagementConfig } from "@/lib/config/case-management";

import { nextActions } from "./next-actions";
import { searchCases } from "./nl-search";
import { classifyRisk } from "./risk-classifier";
import { summarise } from "./summary-generator";
import type {
  AINextAction,
  AIRiskAssessment,
  AISearchHit,
  AISummary,
  CaseAIEngine,
  CaseSnapshot,
} from "./types";

/**
 * Default deterministic rule-based engine.
 *
 * It composes the small individual scorers in this directory and caps its
 * own confidence at 0.7 — production code must surface insights as
 * "AI-suggested, needs human review" rather than auto-acting on them.
 */
class RulesEngine implements CaseAIEngine {
  readonly id = caseManagementConfig.engineId;
  readonly maxConfidence = 0.7;

  classifyRisk(input: CaseSnapshot): AIRiskAssessment {
    return classifyRisk(input);
  }
  summarise(input: CaseSnapshot): AISummary {
    return summarise(input);
  }
  nextActions(input: CaseSnapshot): AINextAction[] {
    return nextActions(input);
  }
  search(query: string, candidates: CaseSnapshot[]): AISearchHit[] {
    return searchCases(query, candidates);
  }
}

let activeEngine: CaseAIEngine = new RulesEngine();

export function getCaseAIEngine(): CaseAIEngine {
  return activeEngine;
}

/**
 * Allow alternative engines (e.g. an LLM-backed implementation) to be
 * installed at startup. Tests can also use this to swap a stub.
 */
export function setCaseAIEngine(engine: CaseAIEngine): void {
  activeEngine = engine;
}

export function resetCaseAIEngine(): void {
  activeEngine = new RulesEngine();
}

export type { CaseAIEngine } from "./types";
