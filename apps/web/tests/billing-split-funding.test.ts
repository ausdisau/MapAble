import { describe, expect, it } from "vitest";

import {
  defaultCareTravelSplit,
  defaultFoodsSplit,
} from "@/lib/billing/calculations/charge";
import { allocateProportionally } from "@/lib/billing/money";

describe("split funding allocations", () => {
  it("foods split is configurable weights not a fixed percentage", () => {
    const split = defaultFoodsSplit();
    expect(split.buckets.length).toBeGreaterThanOrEqual(2);
    const keys = split.buckets.map((b) => b.key);
    expect(keys).toEqual(
      expect.arrayContaining(["preparation", "ingredient", "delivery"])
    );
    const total = 6400;
    const weights = split.buckets.map((b) => b.weight);
    const parts = allocateProportionally(total, weights);
    expect(parts.reduce((s, v) => s + v, 0)).toBe(total);
  });

  it("care travel split separates care and travel buckets", () => {
    const split = defaultCareTravelSplit();
    const keys = split.buckets.map((b) => b.key);
    expect(keys).toEqual(expect.arrayContaining(["care", "travel"]));
  });
});
