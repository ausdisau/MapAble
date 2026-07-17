import { readUIMessageStream } from "ai";
import { describe, expect, it } from "vitest";

import type { ProviderFinderAskTurn } from "@/lib/provider-finder/ask-bridge";
import {
  buildFinderAgentStreamData,
  createFinderChatResponseStream,
} from "@/lib/provider-finder/conversation/stream-assistant";

function clarificationTurn(): ProviderFinderAskTurn {
  return {
    interpretation: {
      sourceQuery: "support worker",
      parsed: true,
      configured: true,
      filters: {
        q: "support worker",
        location: "",
        access: "",
        service: "",
        provider: "",
      },
      serviceCategorySlug: null,
      serviceCategoryId: null,
      accessNeedIds: [],
      accessNeeds: { ids: [], confidence: 0, source: "none" },
      confidence: 0.2,
      engineId: "test",
    },
    applied: {
      query: "support worker",
      location: "",
      providerName: "",
      serviceQuery: "",
      accessQuery: "",
      supportType: null,
      accessNeedIds: [],
    },
    replyText: "What type of support are you looking for?",
    searchParams: new URLSearchParams({ q: "support worker" }),
    providerResults: [],
    agent: {
      sessionId: "finder-test",
      turnIndex: 1,
      status: "needs_clarification",
      clarificationQuestion: "What type of support are you looking for?",
      clarificationSlot: "service",
      suggestedChoices: [{ label: "Personal care", value: "Personal care" }],
      filledSlots: { location: false, service: false, access: true },
    },
  };
}

describe("guided search stream", () => {
  it("buildFinderAgentStreamData maps ask turn agent meta", () => {
    const turn = clarificationTurn();
    const data = buildFinderAgentStreamData(turn);
    expect(data).toMatchObject({
      sessionId: "finder-test",
      status: "needs_clarification",
      clarificationSlot: "service",
    });
    expect(data?.suggestedChoices?.length).toBeGreaterThan(0);
  });

  it("createFinderChatResponseStream emits data-finderAgent before interpretation", async () => {
    const turn = clarificationTurn();
    const stream = createFinderChatResponseStream({
      turn,
      useLlmStream: false,
    });

    const parts: string[] = [];
    for await (const message of readUIMessageStream({ stream })) {
      for (const part of message.parts) {
        parts.push(part.type);
      }
    }

    const agentIndex = parts.indexOf("data-finderAgent");
    const interpretationIndex = parts.indexOf("data-finderInterpretation");
    expect(agentIndex).toBeGreaterThanOrEqual(0);
    expect(interpretationIndex).toBeGreaterThan(agentIndex);
  });
});
