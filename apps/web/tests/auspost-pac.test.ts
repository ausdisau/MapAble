import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearAuspostPacClientCache } from "@/lib/integrations/auspost-pac/client";
import { normalizePostcodeSearchResponse } from "@/lib/integrations/auspost-pac/normalize";
import { searchPostcodes } from "@/lib/integrations/auspost-pac/postcode-search-service";
import { auspostLocationAdapter } from "@/lib/search/auspost-location-adapter";
import { compositeLocationAdapter } from "@/lib/search/composite-location-adapter";

vi.mock("@/lib/search/local-location-adapter", () => ({
  localLocationAdapter: {
    search: vi.fn(async () => []),
  },
}));

describe("AusPost PAC normalize", () => {
  it("normalizes single locality object", () => {
    const result = normalizePostcodeSearchResponse({
      localities: {
        locality: {
          location: "MELBOURNE",
          state: "VIC",
          postcode: "3000",
        },
      },
    });
    expect(result.localities).toHaveLength(1);
    expect(result.localities[0]).toMatchObject({
      location: "MELBOURNE",
      state: "VIC",
      postcode: "3000",
    });
  });

  it("normalizes locality array", () => {
    const result = normalizePostcodeSearchResponse({
      localities: {
        locality: [
          { location: "SYDNEY", state: "NSW", postcode: "2000" },
          { location: "PARRAMATTA", state: "NSW", postcode: "2150" },
        ],
      },
    });
    expect(result.localities).toHaveLength(2);
  });
});

describe("AusPost PAC client", () => {
  beforeEach(() => {
    vi.stubEnv("AUSPOST_PAC_API_KEY", "test-key-32charsxxxxxxxxxxxxxxx");
    vi.stubEnv("AUSPOST_PAC_ENABLED", "true");
    vi.stubEnv("AUSPOST_PAC_ENRICH_LOCATION_SEARCH", "true");
    clearAuspostPacClientCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearAuspostPacClientCache();
  });

  it("throws when API key is missing", async () => {
    vi.stubEnv("AUSPOST_PAC_API_KEY", "");
    await expect(searchPostcodes({ q: "3000" })).rejects.toMatchObject({
      code: "AUSPOST_PAC_NOT_CONFIGURED",
    });
  });

  it("calls postcode search with AUTH-KEY header", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () =>
        JSON.stringify({
          localities: {
            locality: { location: "MELBOURNE", state: "VIC", postcode: "3000" },
          },
        }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await searchPostcodes({ q: "Melbourne", state: "VIC" });
    expect(result.localities[0]?.postcode).toBe("3000");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["AUTH-KEY"]).toBe(
      "test-key-32charsxxxxxxxxxxxxxxx",
    );
  });
});

describe("auspostLocationAdapter", () => {
  beforeEach(() => {
    vi.stubEnv("AUSPOST_PAC_API_KEY", "test-key-32charsxxxxxxxxxxxxxxx");
    vi.stubEnv("AUSPOST_PAC_ENABLED", "true");
    clearAuspostPacClientCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearAuspostPacClientCache();
  });

  it("maps suburbs to autocomplete suggestions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            localities: {
              locality: [
                { location: "ST IVES", state: "NSW", postcode: "2075" },
                { location: "ST IVES CHASE", state: "NSW", postcode: "2075" },
              ],
            },
          }),
      }),
    );

    const results = await auspostLocationAdapter.search("St Ives", 5);
    expect(results).toHaveLength(2);
    expect(results[0]?.label).toBe("St Ives NSW");
    expect(results[0]?.metadata?.suburb).toBe("St Ives");
    expect(results[0]?.metadata?.postcode).toBe("2075");
  });
});

describe("compositeLocationAdapter", () => {
  beforeEach(() => {
    vi.stubEnv("AUSPOST_PAC_API_KEY", "test-key-32charsxxxxxxxxxxxxxxx");
    vi.stubEnv("AUSPOST_PAC_ENABLED", "true");
    clearAuspostPacClientCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    clearAuspostPacClientCache();
  });

  it("fills suburb suggestions from AusPost when local DB has no match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        text: async () =>
          JSON.stringify({
            localities: {
              locality: { location: "BONDI", state: "NSW", postcode: "2026" },
            },
          }),
      }),
    );

    const results = await compositeLocationAdapter.search("Bondi", 5);
    expect(results).toHaveLength(1);
    expect(results[0]?.label).toBe("Bondi NSW");
  });
});
