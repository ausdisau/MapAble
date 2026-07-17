import { runProviderFinderTurnWithAgentFlag } from "@/lib/agent/run-agent-turn";
import { appendProviderFinderTurn } from "@/lib/agent-sessions/provider-finder-session";
import type { CopilotActionPlan } from "@/lib/copilot/types";
import {
  serialiseFinderPayload,
  type ProviderFinderSessionFields,
} from "@/lib/provider-finder/ask-bridge";

const DIRECTORY_DISCLAIMER =
  "Provider listings come from the public NDIS provider finder export. They are not verified by MapAble as current NDIS registration.";

export type PlanProviderFinderOptions = {
  providerSlug?: string;
  providerName?: string;
  agentSessionId?: string;
  messages?: { role: "user" | "assistant"; content: string }[];
};

export async function planProviderFinderCopilotActions(
  query: string,
  session?: Partial<ProviderFinderSessionFields>,
  options?: PlanProviderFinderOptions,
): Promise<CopilotActionPlan> {
  const turn = await runProviderFinderTurnWithAgentFlag(query, session, options);
  const toolsCalled = turn.toolsCalled ?? [
    "interpretFinderQuery",
    "searchNdisProviders",
  ];

  if (options?.agentSessionId && turn.agent) {
    appendProviderFinderTurn(options.agentSessionId, {
      userText: query,
      assistantText: turn.replyText,
      applied: turn.applied,
      interpretation: turn.interpretation,
      agent: turn.agent,
    });
  }

  const finderPayload = serialiseFinderPayload(turn);

  const lowConfidence =
    turn.interpretation.parsed && turn.interpretation.confidence < 0.6;

  const warnings = [
    {
      level: "info" as const,
      message: DIRECTORY_DISCLAIMER,
    },
    ...(lowConfidence
      ? [
          {
            level: "warning" as const,
            message:
              "AI-suggested filters — adjust any field if something looks off.",
          },
        ]
      : []),
  ];

  if (
    turn.agent?.status === "needs_clarification" &&
    turn.providerResults.length === 0
  ) {
    return {
      summary: "Provider search",
      plainLanguageAnswer: turn.replyText,
      filters: { finder: finderPayload },
      actions: [],
      draftRecords: [],
      requiredConfirmations: [],
      warnings,
      providerResults: [],
      agent: turn.agent,
      toolsCalled,
    };
  }

  if (turn.providerResults.length === 0) {
    warnings.push({
      level: "info",
      message:
        "No matching rows in the live NDIS directory table yet — try the Show results button to search the bundled directory, or run provider ingestion.",
    });
  }

  return {
    summary: "Provider search",
    plainLanguageAnswer: turn.replyText,
    filters: {
      finder: finderPayload,
    },
    actions: [
      {
        type: "OPEN_PROVIDER_SEARCH",
        label: "Show matching providers",
        requiresConfirmation: false,
      },
    ],
    draftRecords: [],
    requiredConfirmations: [],
    warnings,
    providerResults: turn.providerResults,
    agent: turn.agent,
    toolsCalled,
  };
}
