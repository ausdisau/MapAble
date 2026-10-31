import { describe, expect, it } from "vitest";
import { isCommerceDesignLabEnabled } from "@/lib/marketplace/design-lab-gate";

import {
  COMMERCE_LAB_OFFERS,
  addPlanningLine,
  filterCommerceOffers,
  formatDemoPrice,
  getCommerceOffer,
  makePrivatePlanningNote,
  sellerConceptErrors,
  summaryOfPlanning,
  updatePlanningQuantity,
} from "@/lib/marketplace/design-lab-model";

describe("MapAble commerce design lab: reference-driven domain", () => {
  it("uses its own default-off gate without enabling commerce checkout", () => {
    expect(isCommerceDesignLabEnabled({})).toBe(false);
    expect(isCommerceDesignLabEnabled({ MAPABLE_COMMERCE_DESIGN_LAB_ENABLED: "false" })).toBe(false);
    expect(isCommerceDesignLabEnabled({ MAPABLE_COMMERCE_DESIGN_LAB_ENABLED: "true" })).toBe(true);
  });

  it("only contains synthetic sellers and unverified evidence", () => {
    expect(COMMERCE_LAB_OFFERS.length).toBeGreaterThanOrEqual(15);
    expect(COMMERCE_LAB_OFFERS.every((offer) => offer.sellerName === "Synthetic seller")).toBe(true);
    expect(COMMERCE_LAB_OFFERS.every((offer) => offer.evidence.every((row) =>
      row.state === "example-statement" || row.state === "unknown"
    ))).toBe(true);
    expect(COMMERCE_LAB_OFFERS.every((offer) => !("ndisSupportItemCode" in offer))).toBe(true);
  });

  it("represents physical goods, rentals, services, digital and reuse separately", () => {
    expect(new Set(COMMERCE_LAB_OFFERS.map((offer) => offer.kind))).toEqual(
      new Set(["product", "rental", "service", "digital", "reuse"]),
    );
    expect(getCommerceOffer("demo-chair")?.route).toBe("specialist");
    expect(getCommerceOffer("demo-hoist")?.route).toBe("unavailable");
  });

  it("filters by functional access without diagnosis or identity", () => {
    const items = filterCommerceOffers({ search: "AAC", need: "remote" });
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.needs.includes("remote"))).toBe(true);
    const filtered = filterCommerceOffers({ kind: "service", specialist: "exclude" });
    expect(filtered.every((item) => item.kind === "service" && item.route === "enquire")).toBe(true);
  });

  it("puts unpriced specialist items after priced examples for price sorting", () => {
    const sorted = filterCommerceOffers({ order: "price" });
    const firstUnknown = sorted.findIndex((item) => item.priceCents === null);
    expect(firstUnknown).toBeGreaterThan(0);
    expect(sorted.slice(firstUnknown).every((item) => item.priceCents === null)).toBe(true);
  });

  it("never permits restricted equipment in a planning list", () => {
    expect(() => addPlanningLine([], "demo-hoist")).toThrow();
    expect(() => addPlanningLine([], "not-real")).toThrow();
    expect(addPlanningLine([], "demo-chair")).toEqual([{ offerId: "demo-chair", quantity: 1 }]);
  });

  it("toggles a saved option without duplicates and limits to eight items", () => {
    const once = addPlanningLine([], "demo-jar");
    expect(addPlanningLine(once, "demo-jar")).toEqual([]);
    const items = COMMERCE_LAB_OFFERS.filter((item) => item.route !== "unavailable").slice(0, 9);
    const list = items.slice(0, 8).map((item) => ({ offerId: item.id, quantity: 1 }));
    expect(() => addPlanningLine(list, items[8].id)).toThrow(/eight/);
  });

  it("rejects unsafe quantities and marks the whole basket as nonpayable", () => {
    const initial = [{ offerId: "demo-jar", quantity: 1 }];
    expect(updatePlanningQuantity(initial, "demo-jar", 3)[0].quantity).toBe(3);
    for (const qty of [0, 6, 1.4, -1]) {
      expect(() => updatePlanningQuantity(initial, "demo-jar", qty)).toThrow();
    }
    const mixed = summaryOfPlanning([
      { offerId: "demo-jar", quantity: 2 }, { offerId: "demo-chair", quantity: 1 },
    ]);
    expect(mixed.knownExampleSubtotalCents).toBe(4800);
    expect(mixed.unpricedCount).toBe(1);
    expect(mixed.totalIsKnown).toBe(false);
    expect(mixed.payable).toBe(false);
    expect(formatDemoPrice(null)).toBe("Price not provided");
  });

  it("produces a local-only enquiry note without a real order or payment", () => {
    const note = makePrivatePlanningNote([{ offerId: "demo-jar", quantity: 1 }], "coordinator");
    expect(note).toContain("Not sent");
    expect(note).toContain("no delegated authority");
    expect(note).toContain("No order");
    expect(note).not.toMatch(/stripe|checkout session|payment intent/i);
  });

  it("requires enough seller description and supports all five listing types", () => {
    const bad = sellerConceptErrors({
      title: "x", description: "short", kind: "product", evidenceNote: "",
    });
    expect(bad.length).toBe(2);
    const good = sellerConceptErrors({
      title: "Synthetic example", description: "A fully fictitious accessible planning product.",
      kind: "reuse", evidenceNote: "Requires a human product safety check",
    });
    expect(good).toEqual([]);
  });
});
