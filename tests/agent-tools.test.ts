import { describe, expect, it, vi } from "vitest";

import { runProviderFinderAgentTurn } from "@/lib/agent/run-agent-turn";
import { resetProviderFinderSessionsForTests } from "@/lib/ai/agent-sessions/provider-finder-session";
import {
  buildClarificationQuestion,
  needsProviderFinderClarification,
} from "@/lib/provider/finder/clarification";
import { mergeAppliedFields } from "@/lib/provider/finder/merge-applied";
import { parseLocationForNdisSearch } from "@/lib/provider/finder/ndis-search-from-applied";

vi.mock("@/lib/ingestion/ndis-providers-search", () => ({
  searchNdisProviders: vi.fn(async () => ({
    providers: [
      {
        source_id: "test-1",
        provider_name: "Test Provider",
        suburb: "Parramatta",
        state: "NSW",
        postcode: "2150",
        phone: null,
        email: null,
        website: null,
        services: ["Occupational Therapy"],
        registration_groups: ["Group"],
        updated_at: new Date(),
      },
    ],
    count: 1,
  })),
}));

vi.mock("@/lib/provider/finder/conversation/run-turn", () => ({
  runProviderFinderConversationTurn: vi.fn(async () => ({
    interpretation: {
      sourceQuery: "OT near Parramatta",
      parsed: true,
      confidence: 0.85,
      filters: {
        q: "",
        location: "Parramatta NSW",
        access: "",
        service: "occupational therapy",
        provider: "",
      },
      serviceCategorySlug: "occupational-therapy",
      serviceCategoryId: null,
      accessNeedIds: [],
      accessNeeds: { ids: [], confidence: 0, source: "none" },
      engineId: "test",
      configured: true,
    },
    applied: {
      query: "",
      location: "Parramatta NSW",
      providerName: "",
      serviceQuery: "occupational therapy",
      accessQuery: "",
      supportType: null,
      accessNeedIds: [],
    },
    replyText: "Searching near Parramatta.",
  })),
}));

describe("agent tools and session", () => {
  it("parseLocationForNdisSearch extracts state and postcode", () => {
    const loc = parseLocationForNdisSearch("Parramatta NSW 2150");
    expect(loc.state).toBe("NSW");
    expect(loc.postcode).toBe("2150");
  });

  it("mergeAppliedFields keeps prior location when next is empty", () => {
    const merged = mergeAppliedFields(
      {
        query: "",
        location: "Parramatta NSW",
        providerName: "",
        serviceQuery: "OT",
        accessQuery: "",
        supportType: null,
        accessNeedIds: [],
      },
      {
        query: "wheelchair",
        location: "",
        providerName: "",
        serviceQuery: "",
        accessQuery: "",
        supportType: null,
        accessNeedIds: [],
      },
    );
    expect(merged.location).toBe("Parramatta NSW");
    expect(merged.query).toBe("wheelchair");
  });

  it("runProviderFinderAgentTurn returns toolsCalled and results", async () => {
    resetProviderFinderSessionsForTests();
    const turn = await runProviderFinderAgentTurn("OT near Parramatta", {
      query: "",
      location: "",
      providerName: "",
      serviceQuery: "",
      accessQuery: "",
    });
    expect(turn.toolsCalled).toContain("interpretFinderQuery");
    expect(turn.toolsCalled).toContain("searchNdisProviders");
    expect(turn.providerResults.length).toBe(1);
    expect(turn.agent?.status).toBe("complete");
  });

  it("needs clarification when confidence is low and fields missing", () => {
    const lowConfidenceInterpretation = {
      sourceQuery: "help",
      parsed: true,
      confidence: 0.4,
      filters: {
        q: "",
        location: "",
        access: "",
        service: "",
        provider: "",
      },
      serviceCategorySlug: null,
      serviceCategoryId: null,
      accessNeedIds: [],
      accessNeeds: {
        ids: [],
        confidence: 0,
        source: "none" as const,
      },
      engineId: "test",
      configured: true,
    };
    expect(needsProviderFinderClarification(lowConfidenceInterpretation)).toBe(
      true,
    );
    expect(
      buildClarificationQuestion(lowConfidenceInterpretation).length,
    ).toBeGreaterThan(10);
  });
});
