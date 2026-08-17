import { describe, expect, it, vi, beforeEach } from "vitest";

import { GET } from "@/app/api/search/autocomplete/route";

vi.mock("@/lib/search/autocomplete-service", () => ({
  searchAutocompleteWithMeta: vi.fn(
    async (input: { mode?: string }) => ({
      groups: {
        providers: [
          {
            id: "p1",
            type: "provider",
            typeLabel: "Provider",
            label: "Demo",
            value: "Demo",
          },
        ],
        services: [],
        locations: [],
        accessibilityFeatures: [],
        languages: [],
        popularSearches: [],
      },
      meta: {
        mode: input.mode ?? "reactive",
        degraded: false,
      },
    }),
  ),
}));

describe("GET /api/search/autocomplete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects query shorter than 2 characters", async () => {
    const res = await GET(
      new Request("http://localhost/api/search/autocomplete?q=a&context=homepage"),
    );
    expect(res.status).toBe(400);
  });

  it("rejects invalid context", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/search/autocomplete?q=physio&context=invalid",
      ),
    );
    expect(res.status).toBe(400);
  });

  it("returns grouped suggestions for valid query", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/search/autocomplete?q=physio&context=provider_finder",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.groups.providers).toHaveLength(1);
    expect(body.meta.mode).toBe("reactive");
  });

  it("accepts proactive mode without query", async () => {
    const res = await GET(
      new Request(
        "http://localhost/api/search/autocomplete?context=homepage&mode=proactive",
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.meta.mode).toBe("proactive");
  });
});
