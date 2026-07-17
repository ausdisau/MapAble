import {
  getProviderFinderSession,
  priorAppliedFromSession,
} from "@/lib/agent-sessions/provider-finder-session";
import { searchAgentConfig } from "@/lib/config/search-agent";
import type { PlanProviderFinderOptions } from "@/lib/copilot/plan-provider-finder";
import {
  runProviderFinderAskTurn,
  type ProviderFinderAskTurn,
  type ProviderFinderSessionFields,
} from "@/lib/provider-finder/ask-bridge";
import { mergeProviderContextIntoQuery } from "@/lib/provider-finder/ask-bridge";
import {
  buildClarificationQuestion,
  enrichCopilotAgentMeta,
  needsProviderFinderClarification,
} from "@/lib/provider-finder/clarification";
import { runProviderFinderConversationTurn } from "@/lib/provider-finder/conversation/run-turn";
import { mergeAppliedFields } from "@/lib/provider-finder/merge-applied";
import { searchProvidersForAppliedTurn } from "@/lib/provider-finder/ndis-search-from-applied";
import { buildFinderSearchParams } from "@/lib/search/apply-interpretation";

import { explainProvider } from "./tools/explain-provider";
import { geocodeLocation } from "./tools/geocode-location";
import {
  TOOL_EXPLAIN_PROVIDER,
  TOOL_GEOCODE_LOCATION,
  TOOL_INTERPRET_FINDER_QUERY,
  TOOL_SEARCH_NDIS_PROVIDERS,
} from "./tools/index";

const MAX_AGENT_STEPS = 3;

export type AgentTurnResult = ProviderFinderAskTurn & {
  toolsCalled: string[];
};

/**
 * Bounded agent turn: interpret → (optional clarify) → search → reply.
 * Falls back to the same outcome as runProviderFinderAskTurn when steps exhaust.
 */
export async function runProviderFinderAgentTurn(
  query: string,
  session?: Partial<ProviderFinderSessionFields>,
  options?: PlanProviderFinderOptions,
): Promise<AgentTurnResult> {
  const toolsCalled: string[] = [];
  const priorApplied = priorAppliedFromSession(
    options?.agentSessionId,
    session,
  );
  const existing = options?.agentSessionId
    ? getProviderFinderSession(options.agentSessionId)
    : null;
  const sessionId =
    options?.agentSessionId?.trim() || `finder-${Date.now()}`;
  const turnIndex = (existing?.turnIndex ?? 0) + 1;

  if (toolsCalled.length < MAX_AGENT_STEPS) {
    toolsCalled.push(TOOL_INTERPRET_FINDER_QUERY);
  }

  const effectiveQuery = mergeProviderContextIntoQuery(query, options);
  const convo = await runProviderFinderConversationTurn(
    effectiveQuery,
    session as ProviderFinderSessionFields,
  );
  const applied = mergeAppliedFields(priorApplied, convo.applied);
  if (options?.providerName && !applied.providerName) {
    applied.providerName = options.providerName;
  }

  if (needsProviderFinderClarification(convo.interpretation)) {
    const question = buildClarificationQuestion(convo.interpretation);
    const agent = enrichCopilotAgentMeta(
      {
        sessionId,
        turnIndex,
        status: "needs_clarification",
        clarificationQuestion: question,
      },
      convo.interpretation,
    );
    return {
      interpretation: convo.interpretation,
      applied,
      replyText: question,
      searchParams: buildFinderSearchParams(applied),
      providerResults: [],
      agent,
      toolsCalled,
    };
  }

  if (toolsCalled.length < MAX_AGENT_STEPS) {
    toolsCalled.push(TOOL_SEARCH_NDIS_PROVIDERS);
  }

  if (applied.location && toolsCalled.length < MAX_AGENT_STEPS) {
    toolsCalled.push(TOOL_GEOCODE_LOCATION);
    await geocodeLocation(applied.location);
  }

  const providerResults = await searchProvidersForAppliedTurn(
    applied,
    convo.interpretation,
    { limit: searchAgentConfig.providerFinderResultsLimit },
  );

  if (
    applied.providerName &&
    toolsCalled.length < MAX_AGENT_STEPS &&
    !toolsCalled.includes(TOOL_EXPLAIN_PROVIDER)
  ) {
    toolsCalled.push(TOOL_EXPLAIN_PROVIDER);
    await explainProvider({ providerName: applied.providerName });
  }

  let replyText = convo.replyText;
  if (providerResults.length > 0) {
    replyText = `${convo.replyText} I found ${providerResults.length} listing${providerResults.length === 1 ? "" : "s"} in the NDIS directory export.`;
  }

  const agent = enrichCopilotAgentMeta(
    {
      sessionId,
      turnIndex,
      status: "complete",
    },
    convo.interpretation,
    providerResults,
  );

  return {
    interpretation: convo.interpretation,
    applied,
    replyText,
    searchParams: buildFinderSearchParams(applied),
    providerResults,
    agent,
    toolsCalled,
  };
}

/** When agent flag is off, delegate to standard bridge. */
export async function runProviderFinderTurnWithAgentFlag(
  query: string,
  session?: Partial<ProviderFinderSessionFields>,
  options?: PlanProviderFinderOptions,
): Promise<ProviderFinderAskTurn & { toolsCalled?: string[] }> {
  if (searchAgentConfig.searchAgentEnabled) {
    return runProviderFinderAgentTurn(query, session, options);
  }
  const priorApplied = priorAppliedFromSession(
    options?.agentSessionId,
    session,
  );
  const existing = options?.agentSessionId
    ? getProviderFinderSession(options.agentSessionId)
    : null;
  const turn = await runProviderFinderAskTurn(query, session, {
    providerSlug: options?.providerSlug,
    providerName: options?.providerName,
    priorApplied,
    agentSessionId: options?.agentSessionId,
    agentTurnIndex: existing?.turnIndex ?? 0,
  });
  return { ...turn, toolsCalled: [] };
}
