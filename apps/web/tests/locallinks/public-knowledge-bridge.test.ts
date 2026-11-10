import { describe, expect, it, vi } from "vitest";

import {
  makeDisapediaSearchUrl,
  normalisePublicQuery,
  parseDisapediaPages,
  searchPublicDisapedia,
} from "@/lib/locallinks/public-knowledge-bridge";

describe("LocalLinks public knowledge bridge", () => {
  it("normalises text and limits query length", () => {
    expect(normalisePublicQuery("  rights \n and    access ")).toBe("rights and access");
    expect(normalisePublicQuery("x".repeat(300))).toHaveLength(120);
    expect(normalisePublicQuery({ q: "x" })).toBe("");
  });

  it("rejects unsafe or unrelated upstream origins", () => {
    expect(makeDisapediaSearchUrl("http://disapedia.au", "rights")).toBeNull();
    expect(makeDisapediaSearchUrl("https://evil.example", "rights")).toBeNull();
    expect(makeDisapediaSearchUrl("https://disapedia.au@evil.example", "rights")).toBeNull();
    expect(makeDisapediaSearchUrl("https://disapedia.au:444", "rights")).toBeNull();
    expect(makeDisapediaSearchUrl("https://disapedia.au/foo", "rights")).toBeNull();
    expect(makeDisapediaSearchUrl("https://disapedia.au", "rights")?.searchParams.get("gsrsearch")).toBe("rights");
  });

  it("never makes upstream requests while disabled", async () => {
    const fetcher = vi.fn<typeof fetch>();
    expect(await searchPublicDisapedia("rights", { enabled: false, fetcher })).toMatchObject({
      status: "disabled", results: [],
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("validates source article host and preserves revision provenance", () => {
    const payload = { query: { pages: [
      { pageid: 2, title: "Disability rights", fullurl: "https://disapedia.au/index.php/Disability_rights", revisions: [{ revid: 123, timestamp: "2026-11-10T00:00:00Z" }] },
      { pageid: 3, title: "Injected link", fullurl: "https://phishing.example/steal" },
      { pageid: 2, title: "Duplicate", fullurl: "https://disapedia.au/wiki/Duplicate" },
    ] } };
    expect(parseDisapediaPages(payload, "disapedia.au")).toEqual([{
      pageId: 2,
      title: "Disability rights",
      url: "https://disapedia.au/index.php/Disability_rights",
      revisionId: 123,
      revisionTimestamp: "2026-11-10T00:00:00Z",
    }]);
  });

  it("reports upstream errors as unavailable, not fabricated results", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({ ok: false, status: 503 } as Response);
    expect(await searchPublicDisapedia("access", { enabled: true, fetcher })).toEqual({
      status: "unavailable", source: "disapedia", results: [],
    });
  });

  it("returns only bounded, verified public results on successful reads", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      text: async () => JSON.stringify({ query: { pages: [
        { pageid: 7, title: "Royal Commission", fullurl: "https://disapedia.au/wiki/Royal_Commission", revisions: [{ revid: 11 }] },
      ] } }),
    } as unknown as Response);
    const result = await searchPublicDisapedia("Royal Commission", { enabled: true, fetcher });
    expect(result.status).toBe("ok");
    expect(result.results).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [, init] = fetcher.mock.calls[0];
    expect(init?.credentials).toBe("omit");
    expect(init?.redirect).toBe("error");
  });
});
