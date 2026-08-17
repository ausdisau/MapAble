import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  calculateNdisItemDraft,
  calculateNdisItemDrafts,
  listActCatalogueItems,
} from "@/lib/act/billing";

describe("Act NDIS item calculator", () => {
  beforeEach(() => {
    process.env.MAPABLE_ACT_LAYER_ENABLED = "true";
  });

  afterEach(() => {
    delete process.env.MAPABLE_ACT_LAYER_ENABLED;
  });

  it("seeds example employment and transport codes", () => {
    const codes = listActCatalogueItems().map((c) => c.supportItemCode);
    expect(codes).toContain("10_016_0102_5_3");
    expect(codes).toContain("02_051_0108_1_1");
  });

  it("calculates draft_requires_review amounts from hours × rate", () => {
    const draft = calculateNdisItemDraft({
      supportItemCode: "10_016_0102_5_3",
      hours: 2,
    });
    expect(draft.status).toBe("draft_requires_review");
    expect(draft.totalAmountCents).toBe(draft.unitRateCents * 2);
    expect(draft.messages.some((m) => /permanently prohibited/i.test(m))).toBe(
      true,
    );
  });

  it("aggregates multiple draft lines without approving", () => {
    const pack = calculateNdisItemDrafts([
      { supportItemCode: "10_016_0102_5_3", hours: 1 },
      { supportItemCode: "02_051_0108_1_1", hours: 0.5 },
    ]);
    expect(pack.status).toBe("draft_requires_review");
    expect(pack.lines).toHaveLength(2);
    expect(pack.totalCents).toBeGreaterThan(0);
  });

  it("rejects unknown support items", () => {
    expect(() =>
      calculateNdisItemDraft({
        supportItemCode: "99_999_9999_9_9",
        hours: 1,
      }),
    ).toThrow(/ACT_UNKNOWN_SUPPORT_ITEM/);
  });
});
