import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { compositeLocationAdapter } from "@/lib/search/composite-location-adapter";
import { localLocationAdapter } from "@/lib/search/local-location-adapter";
import type { AutocompleteSuggestion } from "@/types/search";

vi.mock("@/lib/search/auspost-location-adapter", () => ({
  auspostLocationAdapter: {
    search: vi.fn(),
  },
}));

import { auspostLocationAdapter } from "@/lib/search/auspost-location-adapter";

const mockAuspostSearch = vi.mocked(auspostLocationAdapter.search);

describe("compositeLocationAdapter merge", () => {
  beforeEach(() => {
    vi.stubEnv("AUSPOST_PAC_API_KEY", "test-key-32charsxxxxxxxxxxxxxxx");
    vi.stubEnv("AUSPOST_PAC_ENABLED", "true");
    vi.spyOn(localLocationAdapter, "search").mockResolvedValue([
      {
        id: "location-1",
        type: "location",
        typeLabel: "Location",
        label: "Parramatta NSW",
        value: "Parramatta NSW",
        metadata: { suburb: "Parramatta", state: "NSW", postcode: "2150" },
      } satisfies AutocompleteSuggestion,
    ]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("prefers local matches and dedupes AusPost results", async () => {
    mockAuspostSearch.mockResolvedValue([
      {
        id: "auspost-2150-NSW-0",
        type: "location",
        typeLabel: "Location",
        label: "Parramatta NSW",
        value: "Parramatta NSW",
        metadata: { suburb: "Parramatta", state: "NSW", postcode: "2150" },
      },
      {
        id: "auspost-2151-NSW-1",
        type: "location",
        typeLabel: "Location",
        label: "North Parramatta NSW",
        value: "North Parramatta NSW",
        metadata: { suburb: "North Parramatta", state: "NSW", postcode: "2151" },
      },
    ]);

    const results = await compositeLocationAdapter.search("Parr", 5);
    expect(results).toHaveLength(2);
    expect(results[0]?.label).toBe("Parramatta NSW");
    expect(results[1]?.label).toBe("North Parramatta NSW");
    expect(mockAuspostSearch).toHaveBeenCalledWith("Parr", 4);
  });

  it("skips AusPost when local results fill the limit", async () => {
    vi.spyOn(localLocationAdapter, "search").mockResolvedValue(
      Array.from({ length: 5 }, (_, i) => ({
        id: `location-${i}`,
        type: "location" as const,
        typeLabel: "Location",
        label: `Suburb ${i} NSW`,
        value: `Suburb ${i} NSW`,
      })),
    );

    const results = await compositeLocationAdapter.search("Sub", 5);
    expect(results).toHaveLength(5);
    expect(mockAuspostSearch).not.toHaveBeenCalled();
  });
});
