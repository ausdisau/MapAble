import { describe, expect, it, vi } from "vitest";

import { ACCESS_NEEDS } from "@/lib/provider/finder/filters";
vi.mock("@/lib/search/interpreter/load-categories", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/search/interpreter/load-categories")>();
  return {
    ...actual,
    listServiceCategories: vi.fn(async () => actual.getStaticFallbackCategories()),
  };
});

import { applyInterpretationToFields } from "@/lib/search/apply-interpretation";
import {
  filterValidAccessNeedIds,
  resolveAccessNeedIds,
  resolveAccessNeedIdsFromKeywords,
  resolveAccessNeeds,
} from "@/lib/search/interpreter/resolve-access-needs";
import { resolveServiceCategory } from "@/lib/search/interpreter/resolve-service-category";
import { supportTypeFromCategorySlug } from "@/lib/search/interpreter/support-type-map";
import {
  looksLikeNaturalLanguage,
  passthroughFilters,
} from "@/lib/search/interpreter/validation";
import {
  SEARCH_INTERPRET_OPERATIONS,
  searchInterpretJsonError,
} from "@/lib/search/search-interpret-api-contract";
import type { SearchInterpretation } from "@/types/search";

describe("search interpreter validation", () => {
  it("detects natural language queries", () => {
    expect(looksLikeNaturalLanguage("hi")).toBe(false);
    expect(looksLikeNaturalLanguage("Support worker near St Ives")).toBe(true);
    expect(looksLikeNaturalLanguage("wheelchair transport")).toBe(true);
  });

  it("passthrough filters use query as q", () => {
    const f = passthroughFilters("  hello  ");
    expect(f.q).toBe("hello");
    expect(f.location).toBe("");
  });
});

describe("resolveServiceCategory", () => {
  it("resolves occupational therapy from OT text", async () => {
    const result = await resolveServiceCategory({
      serviceText: "occupational therapy",
      qText: "OT assessment",
    });

    expect(result.slug).toBe("occupational-therapy");
    expect(result.confidence).toBeGreaterThan(0.35);
    expect(result.source).toBe("keyword");
  });

  it("honours LLM suggested slug when valid", async () => {
    const result = await resolveServiceCategory({
      serviceText: "",
      qText: "",
      suggestedSlug: "accessible-transport",
    });

    expect(result.slug).toBe("accessible-transport");
    expect(result.source).toBe("llm_slug");
  });
});

describe("resolveAccessNeedIds", () => {
  it("maps wheelchair accessible text", () => {
    const ids = resolveAccessNeedIds("wheelchair accessible transport");
    expect(ids).toContain("wheelchair");
  });

  it("maps Auslan", () => {
    const ids = resolveAccessNeedIds("needs Auslan interpreter");
    expect(ids).toContain("auslan");
    expect(ACCESS_NEEDS.some((n) => n.id === "auslan")).toBe(true);
  });

  it("maps sign language to auslan", () => {
    const ids = resolveAccessNeedIdsFromKeywords("sign language support");
    expect(ids).toContain("auslan");
  });

  it("maps sensory-friendly to low-sensory", () => {
    const ids = resolveAccessNeedIdsFromKeywords("quiet sensory-friendly venue");
    expect(ids).toContain("low-sensory");
  });

  it("maps ceiling hoist to hoist", () => {
    const ids = resolveAccessNeedIdsFromKeywords("ceiling hoist for transfers");
    expect(ids).toContain("hoist");
  });
});

describe("resolveAccessNeeds", () => {
  it("strips invalid LLM suggested ids", async () => {
    const result = await resolveAccessNeeds({
      accessText: "Auslan",
      suggestedIds: ["auslan", "not-a-real-id"],
    });
    expect(result.ids).toEqual(["auslan"]);
    expect(result.source).toBe("llm_ids");
  });

  it("returns unmatchedText when access text does not resolve", async () => {
    const result = await resolveAccessNeeds({
      accessText: "custom bespoke accommodation",
      qText: "",
    });
    expect(result.ids).toEqual([]);
    expect(result.unmatchedText).toBe("custom bespoke accommodation");
    expect(result.confidence).toBeLessThan(0.4);
  });
});

describe("filterValidAccessNeedIds", () => {
  it("dedupes and filters unknown ids", () => {
    expect(filterValidAccessNeedIds(["wheelchair", "bogus", "wheelchair"])).toEqual(
      ["wheelchair"],
    );
  });
});

describe("supportTypeFromCategorySlug", () => {
  it("maps transport category", () => {
    expect(supportTypeFromCategorySlug("accessible-transport")).toBe("transport");
  });
});

describe("applyInterpretationToFields", () => {
  it("handles missing filters and accessNeedIds without throwing", () => {
    const applied = applyInterpretationToFields(
      {
        sourceQuery: "support near Sydney",
        parsed: true,
        configured: true,
        serviceCategorySlug: null,
        serviceCategoryId: null,
        accessNeeds: { ids: [], confidence: 0, source: "none" },
        confidence: 0.5,
        engineId: "test",
      } as unknown as SearchInterpretation,
      {
        query: "fallback query",
        location: "Brisbane",
        providerName: "Acme Care",
        serviceQuery: "support worker",
        accessQuery: "wheelchair",
      },
    );

    expect(applied.query).toBe("support near Sydney");
    expect(applied.location).toBe("Brisbane");
    expect(applied.providerName).toBe("Acme Care");
    expect(applied.serviceQuery).toBe("support worker");
    expect(applied.accessQuery).toBe("wheelchair");
    expect(applied.accessNeedIds).toEqual([]);
    expect(applied.supportType).toBeNull();
  });

  it("applies parsed filters and support type", () => {
    const applied = applyInterpretationToFields(
      {
        sourceQuery: "OT near Parramatta",
        parsed: true,
        configured: true,
        filters: {
          q: "OT assessment",
          location: "Parramatta",
          access: "",
          service: "occupational therapy",
          provider: "",
        },
        serviceCategorySlug: "occupational-therapy",
        serviceCategoryId: "cat-1",
        accessNeedIds: [],
        accessNeeds: { ids: [], confidence: 0, source: "none" },
        confidence: 0.8,
        engineId: "test",
      },
      {
        query: "",
        location: "",
        providerName: "",
        serviceQuery: "",
        accessQuery: "",
      },
    );

    expect(applied.location).toBe("Parramatta");
    expect(applied.supportType).toBe("therapy");
    expect(applied.serviceQuery).toContain("occupational");
  });
});

describe("search interpret API contract", () => {
  it("returns operationId on errors", async () => {
    const res = searchInterpretJsonError(
      SEARCH_INTERPRET_OPERATIONS.interpretQuery,
      429,
      {
        error: "Too many requests",
        code: "RATE_LIMITED",
        retryable: true,
      },
    );
    expect(res.headers.get("X-Operation-Id")).toBe("searchInterpretQuery");
    const body = (await res.json()) as { operationId: string };
    expect(body.operationId).toBe("searchInterpretQuery");
  });
});
