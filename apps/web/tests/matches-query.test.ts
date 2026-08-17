import { describe, expect, it } from "vitest";

import { keywordsMatchQuery, textMatchesQuery } from "@/lib/search/matches-query";

describe("matches-query", () => {
  it("matches partial text", () => {
    expect(textMatchesQuery("Physiotherapy", "phys")).toBe(true);
    expect(textMatchesQuery("OT", "phys")).toBe(false);
  });

  it("matches partial keywords", () => {
    expect(keywordsMatchQuery(["physio", "physical"], "phys")).toBe(true);
    expect(keywordsMatchQuery(["ot", "occupational"], "phys")).toBe(false);
  });
});
