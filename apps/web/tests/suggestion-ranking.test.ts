import { describe, expect, it } from "vitest";

import { rankSuggestions } from "@/lib/search/suggestion-ranking";
import type { AutocompleteSuggestion } from "@/types/search";

const base = (
  partial: Partial<AutocompleteSuggestion> & Pick<AutocompleteSuggestion, "id" | "label" | "value">,
): AutocompleteSuggestion => ({
  type: "service",
  typeLabel: "Service",
  ...partial,
});

describe("rankSuggestions", () => {
  it("ranks prefix matches above substring matches", () => {
    const pool: AutocompleteSuggestion[] = [
      base({ id: "1", label: "Physiotherapy", value: "Physiotherapy" }),
      base({ id: "2", label: "Support physiotherapy", value: "Support physiotherapy" }),
    ];

    const ranked = rankSuggestions({
      suggestions: pool,
      query: "phys",
      mode: "reactive",
    });

    expect(ranked[0]?.label).toBe("Physiotherapy");
    expect(ranked[0]?.matchTier).toBe("prefix");
  });

  it("boosts verified providers", () => {
    const pool: AutocompleteSuggestion[] = [
      {
        id: "u",
        type: "provider",
        typeLabel: "Provider (unverified)",
        label: "Alpha Care",
        value: "Alpha Care",
      },
      {
        id: "v",
        type: "provider",
        typeLabel: "Provider",
        label: "Beta Care",
        value: "Beta Care",
      },
    ];

    const ranked = rankSuggestions({
      suggestions: pool,
      query: "care",
      mode: "reactive",
    });

    expect(ranked[0]?.id).toBe("v");
  });

  it("assigns proactive tier when mode is proactive", () => {
    const ranked = rankSuggestions({
      suggestions: [
        base({ id: "1", label: "Personal care", value: "Personal care" }),
      ],
      query: "",
      mode: "proactive",
    });

    expect(ranked[0]?.matchTier).toBe("proactive");
  });
});
