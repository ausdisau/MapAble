import { searchAgentConfig } from "@/lib/config/search-agent";
import type { CopilotAgentMeta, CopilotProviderResult } from "@/lib/copilot/types";
import {
  buildFinderSearchParams,
  type AppliedSearchFields,
} from "@/lib/search/apply-interpretation";
import type { SearchInterpretation } from "@/types/search";

import {
  buildClarificationQuestion,
  enrichCopilotAgentMeta,
  needsProviderFinderClarification,
} from "./clarification";
import { runProviderFinderConversationTurn } from "./conversation/run-turn";
import { mergeAppliedFields } from "./merge-applied";
import { searchProvidersForAppliedTurn } from "./ndis-search-from-applied";

export type ProviderFinderSessionFields = {
  query: string;
  location: string;
  providerName: string;
  serviceQuery: string;
  accessQuery: string;
};

export type ProviderFinderAskTurn = {
  interpretation: SearchInterpretation;
  applied: AppliedSearchFields;
  replyText: string;
  searchParams: URLSearchParams;
  providerResults: CopilotProviderResult[];
  agent?: CopilotAgentMeta;
};

export type ProviderFinderAskOptions = {
  providerName?: string;
  providerSlug?: string;
  priorApplied?: AppliedSearchFields;
  agentSessionId?: string;
  agentTurnIndex?: number;
};

export function mergeProviderContextIntoQuery(
  query: string,
  options?: { providerName?: string; providerSlug?: string },
): string {
  const base = query.trim();
  const name = options?.providerName?.trim();
  const slug = options?.providerSlug?.trim();
  if (name && !base.toLowerCase().includes(name.toLowerCase())) {
    return base ? `${base} — ${name}` : `Tell me about ${name}`;
  }
  if (slug && !base) {
    return `Tell me about provider ${slug.replace(/-/g, " ")}`;
  }
  return base || " ";
}

/**
 * Single source of truth: NL query → interpretation → finder field snapshot → URL params → NDIS search.
 */
export async function runProviderFinderAskTurn(
  userText: string,
  currentFields?: Partial<ProviderFinderSessionFields>,
  options?: ProviderFinderAskOptions,
): Promise<ProviderFinderAskTurn> {
  const session: ProviderFinderSessionFields = {
    query: currentFields?.query ?? "",
    location: currentFields?.location ?? "",
    providerName:
      currentFields?.providerName?.trim() ||
      options?.providerName?.trim() ||
      "",
    serviceQuery: currentFields?.serviceQuery ?? "",
    accessQuery: currentFields?.accessQuery ?? "",
  };

  const effectiveQuery = mergeProviderContextIntoQuery(userText, options);
  const turn = await runProviderFinderConversationTurn(effectiveQuery, session);

  const applied = mergeAppliedFields(options?.priorApplied, turn.applied);

  if (options?.providerName && !applied.providerName) {
    applied.providerName = options.providerName;
  }

  const sessionId =
    options?.agentSessionId?.trim() || `finder-${Date.now()}`;
  const turnIndex = (options?.agentTurnIndex ?? 0) + 1;

  const clarification = needsProviderFinderClarification(turn.interpretation);
  if (clarification) {
    const question = buildClarificationQuestion(turn.interpretation);
    const agent = enrichCopilotAgentMeta(
      {
        sessionId,
        turnIndex,
        status: "needs_clarification",
        clarificationQuestion: question,
      },
      turn.interpretation,
    );
    return {
      interpretation: turn.interpretation,
      applied,
      replyText: question,
      searchParams: buildFinderSearchParams(applied),
      providerResults: [],
      agent,
    };
  }

  const providerResults = await searchProvidersForAppliedTurn(
    applied,
    turn.interpretation,
    { limit: searchAgentConfig.providerFinderResultsLimit },
  );

  let replyText = turn.replyText;
  if (providerResults.length > 0) {
    replyText = `${turn.replyText} I found ${providerResults.length} listing${providerResults.length === 1 ? "" : "s"} in the NDIS directory export — use Show matching providers to filter the page, or review the matches below.`;
  }

  const agent = enrichCopilotAgentMeta(
    {
      sessionId,
      turnIndex,
      status: "complete",
    },
    turn.interpretation,
    providerResults,
  );

  return {
    interpretation: turn.interpretation,
    applied,
    replyText,
    searchParams: buildFinderSearchParams(applied),
    providerResults,
    agent,
  };
}

/** JSON-safe finder payload for Co-Pilot API responses. */
export function serialiseFinderPayload(turn: ProviderFinderAskTurn) {
  return {
    interpretation: turn.interpretation,
    applied: turn.applied,
    searchParams: Object.fromEntries(turn.searchParams.entries()),
    replyText: turn.replyText,
    providerResults: turn.providerResults,
    agent: turn.agent,
  };
}
