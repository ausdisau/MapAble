import { ACCESS_NEEDS } from "@/lib/provider/finder/filters";
import type { AccessNeedResolution } from "@/types/search";

import { resolveAccessNeedIdsWithLlm } from "./resolve-access-needs-llm";
import { scoreTextAgainstQuery } from "./score-text";

const VALID_ACCESS_NEED_IDS = new Set(ACCESS_NEEDS.map((n) => n.id));

const MIN_KEYWORD_SCORE = 2;

export function filterValidAccessNeedIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const trimmed = id.trim();
    if (!trimmed || !VALID_ACCESS_NEED_IDS.has(trimmed) || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

/** Keyword / label scoring against the ACCESS_NEEDS catalog. */
export function resolveAccessNeedIdsFromKeywords(accessText: string): string[] {
  const text = accessText.trim();
  if (!text) return [];

  const ids = new Set<string>();
  const lower = text.toLowerCase();

  for (const need of ACCESS_NEEDS) {
    if (lower.includes(need.label.toLowerCase())) {
      ids.add(need.id);
      continue;
    }
    const score = scoreTextAgainstQuery(
      [need.label, ...need.keywords],
      text,
    );
    if (score >= MIN_KEYWORD_SCORE) ids.add(need.id);
  }

  return [...ids];
}

/** @deprecated Use resolveAccessNeeds — kept for tests and direct imports. */
export function resolveAccessNeedIds(accessText: string): string[] {
  return resolveAccessNeedIdsFromKeywords(accessText);
}

function keywordConfidence(ids: string[], combinedText: string): number {
  if (ids.length === 0) return 0;
  const text = combinedText.trim();
  if (!text) return 0.45;
  let best = 0;
  for (const need of ACCESS_NEEDS) {
    if (!ids.includes(need.id)) continue;
    const score = scoreTextAgainstQuery(
      [need.label, ...need.keywords],
      text,
    );
    best = Math.max(best, score);
  }
  return Math.min(0.82, 0.38 + best * 0.07);
}

export async function resolveAccessNeeds(input: {
  accessText: string;
  qText?: string;
  suggestedIds?: string[];
}): Promise<AccessNeedResolution> {
  const accessText = input.accessText.trim();
  const combined = [accessText, input.qText?.trim() ?? ""]
    .filter(Boolean)
    .join(" ")
    .trim();

  const llmIds = filterValidAccessNeedIds(input.suggestedIds ?? []);
  const keywordIds = resolveAccessNeedIdsFromKeywords(combined || accessText);
  const merged = filterValidAccessNeedIds([...llmIds, ...keywordIds]);

  if (merged.length > 0) {
    const bothAgree =
      llmIds.length > 0 &&
      keywordIds.length > 0 &&
      llmIds.some((id) => keywordIds.includes(id));
    const kwConf = keywordConfidence(merged, combined || accessText);
    let confidence = llmIds.length > 0 ? 0.72 : kwConf;
    if (bothAgree) confidence = Math.min(0.88, confidence + 0.12);
    return {
      ids: merged,
      confidence,
      source: llmIds.length > 0 ? "llm_ids" : "keyword",
    };
  }

  if (accessText) {
    const llmStep = await resolveAccessNeedIdsWithLlm(combined || accessText);
    if (llmStep.ids.length > 0) {
      return llmStep;
    }
    return {
      ids: [],
      confidence: 0.2,
      source: "none",
      unmatchedText: accessText,
    };
  }

  return { ids: [], confidence: 0, source: "none" };
}
