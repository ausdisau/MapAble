import { createUIMessageStream, streamText } from "ai";

import {
  captureLlmGeneration,
  getLlmAnalyticsProvider,
} from "@/lib/analytics/llm-analytics";
import {
  isSearchInterpreterConfigured,
  searchInterpreterConfig,
} from "@/lib/config/search-interpreter";
import type { CopilotAgentMeta } from "@/lib/copilot/types";
import {
  getInterpreterEngineId,
  getInterpreterModel,
} from "@/lib/search/interpreter/get-model";
import type { FinderAgentData } from "@/types/provider-finder-chat";

import type { ProviderFinderAskTurn } from "../ask-bridge";
import { enrichCopilotAgentMeta } from "../clarification";

import { PROVIDER_FINDER_CHAT_SYSTEM } from "./prompt";
import type { ProviderFinderConversationTurn } from "./run-turn";

type FinderStreamTurn = ProviderFinderConversationTurn | ProviderFinderAskTurn;

function isAskTurn(turn: FinderStreamTurn): turn is ProviderFinderAskTurn {
  return "agent" in turn && turn.agent !== undefined;
}

export function buildFinderAgentStreamData(
  turn: FinderStreamTurn,
): FinderAgentData | null {
  if (isAskTurn(turn) && turn.agent) {
    return {
      sessionId: turn.agent.sessionId,
      turnIndex: turn.agent.turnIndex,
      status: turn.agent.status,
      clarificationQuestion: turn.agent.clarificationQuestion,
      clarificationSlot: turn.agent.clarificationSlot,
      suggestedChoices: turn.agent.suggestedChoices,
      filledSlots: turn.agent.filledSlots,
      providerResults: turn.providerResults,
    };
  }

  const enriched = enrichCopilotAgentMeta(
    {
      sessionId: `finder-${Date.now()}`,
      turnIndex: 1,
      status: "complete",
    } satisfies CopilotAgentMeta,
    turn.interpretation,
  );

  return {
    sessionId: enriched.sessionId,
    turnIndex: enriched.turnIndex,
    status: enriched.status,
    clarificationQuestion: enriched.clarificationQuestion,
    clarificationSlot: enriched.clarificationSlot,
    suggestedChoices: enriched.suggestedChoices,
    filledSlots: enriched.filledSlots,
  };
}

export function streamFinderAssistantText(
  turn: FinderStreamTurn,
): AsyncIterable<string> {
  if (!isSearchInterpreterConfigured()) {
    return textIterable(turn.replyText);
  }

  const result = streamText({
    model: getInterpreterModel(),
    system: PROVIDER_FINDER_CHAT_SYSTEM,
    prompt: [
      `User query: ${turn.interpretation.sourceQuery}`,
      `Structured interpretation (JSON): ${JSON.stringify(turn.interpretation)}`,
      `Suggested reply baseline: ${turn.replyText}`,
      "Respond in 2–4 sentences. Do not repeat the JSON.",
    ].join("\n\n"),
    temperature: 0.35,
  });

  return tracedTextStream(result.textStream, {
    traceName: "provider_finder_chat_reply",
    model: searchInterpreterConfig.modelId,
    provider: getLlmAnalyticsProvider(getInterpreterEngineId()),
    queryLength: turn.interpretation.sourceQuery.length,
  });
}

async function* textIterable(text: string): AsyncGenerator<string> {
  yield text;
}

async function* tracedTextStream(
  stream: AsyncIterable<string>,
  options: {
    traceName: string;
    model: string;
    provider: string;
    queryLength: number;
  },
): AsyncGenerator<string> {
  const startedAt = Date.now();
  let outputLength = 0;
  let captured = false;

  const capture = (success: boolean, errorName?: string) => {
    if (captured) return;
    captured = true;
    captureLlmGeneration({
      traceName: options.traceName,
      model: options.model,
      provider: options.provider,
      latencyMs: Date.now() - startedAt,
      success,
      errorName,
      metadata: {
        query_length: options.queryLength,
        output_length: outputLength,
      },
    });
  };

  try {
    for await (const delta of stream) {
      outputLength += delta.length;
      yield delta;
    }

    capture(true);
  } catch (error) {
    capture(false, error instanceof Error ? error.name : "UnknownError");
    throw error;
  } finally {
    // Consumer break, client disconnect, or maxDuration cutoff closes the
    // generator before completion; record the aborted generation once.
    capture(false, "StreamAborted");
  }
}

export function createFinderChatResponseStream(options: {
  turn: FinderStreamTurn;
  useLlmStream: boolean;
}) {
  const { turn, useLlmStream } = options;

  return createUIMessageStream({
    execute: async ({ writer }) => {
      const agentData = buildFinderAgentStreamData(turn);
      if (agentData) {
        writer.write({
          type: "data-finderAgent",
          id: "finder-agent",
          data: agentData,
        });
      }

      writer.write({
        type: "data-finderInterpretation",
        id: "finder-interpretation",
        data: {
          interpretation: turn.interpretation,
          applied: turn.applied,
        },
      });

      if (useLlmStream) {
        const stream = streamFinderAssistantText(turn);
        const textId = "finder-assistant-text";
        writer.write({ type: "text-start", id: textId });

        for await (const delta of stream) {
          if (delta) {
            writer.write({ type: "text-delta", id: textId, delta });
          }
        }

        writer.write({ type: "text-end", id: textId });
      } else {
        const textId = "finder-assistant-text";
        writer.write({ type: "text-start", id: textId });
        writer.write({
          type: "text-delta",
          id: textId,
          delta: turn.replyText,
        });
        writer.write({ type: "text-end", id: textId });
      }
    },
  });
}
