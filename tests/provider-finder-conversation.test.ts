import { describe, expect, it } from "vitest";

import { extractLastUserText } from "@/lib/provider/finder/conversation/extract-user-text";
import { formatFinderReplyFromInterpretation } from "@/lib/provider/finder/conversation/format-reply";

describe("provider finder conversation", () => {
  it("extracts last user message text", () => {
    const text = extractLastUserText([
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text: "Hello" }],
      },
      {
        id: "2",
        role: "assistant",
        parts: [{ type: "text", text: "Hi" }],
      },
      {
        id: "3",
        role: "user",
        parts: [{ type: "text", text: "OT in Parramatta" }],
      },
    ]);

    expect(text).toBe("OT in Parramatta");
  });

  it("formats parsed interpretation reply", () => {
    const reply = formatFinderReplyFromInterpretation({
      sourceQuery: "wheelchair transport Parramatta",
      parsed: true,
      configured: true,
      filters: {
        q: "transport",
        location: "Parramatta",
        access: "wheelchair",
        service: "accessible transport",
        provider: "",
      },
      serviceCategorySlug: "accessible-transport",
      serviceCategoryId: "1",
      accessNeedIds: ["wheelchair"],
      accessNeeds: { ids: ["wheelchair"], confidence: 0.8, source: "keyword" },
      confidence: 0.8,
      engineId: "test",
    });

    expect(reply).toContain("Parramatta");
    expect(reply).toContain("accessible transport");
  });
});
