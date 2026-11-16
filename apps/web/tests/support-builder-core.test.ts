import { describe, expect, it } from "vitest";

import {
  composeDraftSummary,
  detectSupportKinds,
  readableWebsite,
} from "@/lib/support-builder/core";

describe("Support Builder participant-first core", () => {
  it("detects multiple support components without deciding funding eligibility", () => {
    expect(
      detectSupportKinds(
        "I need help getting ready, accessible transport and a social activity",
      ),
    ).toEqual([
      "personal-assistance",
      "community-participation",
      "accessible-transport",
    ]);
  });

  it("does not invent components from unrelated text", () => {
    expect(detectSupportKinds("Find support in Penrith")).toEqual([]);
  });

  it("rejects script and non-http provider URLs", () => {
    expect(readableWebsite("javascript:alert(1)")).toBeNull();
    expect(readableWebsite("file:///etc/passwd")).toBeNull();
    expect(readableWebsite("https://example.org")).toBe("https://example.org/");
  });

  it("labels a draft as unsent and unverified", () => {
    const summary = composeDraftSummary({
      locality: "Penrith NSW",
      query: "",
      kinds: ["accessible-transport"],
      frequency: "weekly",
    });
    expect(summary).toContain("no provider has been contacted");
    expect(summary).toContain("not confirmed");
    expect(summary).toContain("Penrith NSW");
  });
});
