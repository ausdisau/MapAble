import { describe, expect, it, vi, beforeEach } from "vitest";

import { POST } from "@/app/api/mapable/ask/route";
import { requireApiSession } from "@/lib/api/auth-handler";
import { getOptionalApiUser } from "@/lib/api/optional-session";
import { classifyIntent } from "@/lib/copilot/intentRouter";
import {
  mergeProviderContextIntoQuery,
  runProviderFinderAskTurn,
} from "@/lib/provider/finder/ask-bridge";
import { mergeAppliedFields } from "@/lib/provider/finder/merge-applied";

vi.mock("@/lib/api/optional-session", () => ({
  getOptionalApiUser: vi.fn(),
}));

vi.mock("@/lib/api/auth-handler", () => ({
  requireApiSession: vi.fn(),
}));

vi.mock("@/lib/ingestion/ndis-providers-search", () => ({
  searchNdisProviders: vi.fn(async () => ({ providers: [], count: 0 })),
}));

vi.mock("@/lib/ai/agent-ops/agent-run-service", () => ({
  createAgentRun: vi.fn(async () => ({ id: "run-1", skipped: false })),
}));

describe("POST /api/mapable/ask provider_finder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 for anonymous provider_finder without drafts", async () => {
    vi.mocked(getOptionalApiUser).mockResolvedValue(null);

    const res = await POST(
      new Request("http://localhost/api/mapable/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "OT near Parramatta",
          context: "provider_finder",
        }),
      }),
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.intent).toBe("provider_finder");
    expect(body.finder?.interpretation).toBeDefined();
    expect(body.draftRecords).toEqual([]);
  });

  it("returns 401 for default context when not signed in", async () => {
    vi.mocked(getOptionalApiUser).mockResolvedValue(null);
    vi.mocked(requireApiSession).mockResolvedValue(
      Response.json({ error: "Unauthorized" }, { status: 401 }),
    );

    const res = await POST(
      new Request("http://localhost/api/mapable/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "Help with my NDIS plan",
          context: "default",
        }),
      }),
    );

    expect(res.status).toBe(401);
  });
});

describe("provider finder ask integration", () => {
  it("classifies OT near Parramatta as provider_finder", () => {
    const intent = classifyIntent("OT assessment near Parramatta");
    expect(intent.type).toBe("provider_finder");
  });

  it("classifies provider finder context queries", () => {
    const intent = classifyIntent("registered provider in Newcastle", "All", {
      context: "provider_finder",
    });
    expect(intent.type).toBe("provider_finder");
  });

  it("mergeProviderContextIntoQuery includes provider name", () => {
    expect(
      mergeProviderContextIntoQuery("", { providerName: "Acme Care" }),
    ).toBe("Tell me about Acme Care");
  });

  it("runProviderFinderAskTurn returns search params", async () => {
    const turn = await runProviderFinderAskTurn("OT near Parramatta", {
      query: "",
      location: "",
      providerName: "",
      serviceQuery: "",
      accessQuery: "",
    });
    expect(turn.searchParams.toString().length).toBeGreaterThan(0);
    expect(turn.replyText.length).toBeGreaterThan(0);
    expect(turn.interpretation.sourceQuery).toContain("Parramatta");
    expect(turn.agent?.sessionId).toBeDefined();
  });

  it("mergeAppliedFields accumulates location across turns", () => {
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
        query: "support worker",
        location: "",
        providerName: "",
        serviceQuery: "",
        accessQuery: "",
        supportType: null,
        accessNeedIds: [],
      },
    );
    expect(merged.location).toBe("Parramatta NSW");
    expect(merged.query).toBe("support worker");
  });
});
