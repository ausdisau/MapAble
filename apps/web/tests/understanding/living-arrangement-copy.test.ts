import { describe, expect, it } from "vitest";

import { defaultInformalSupportRiskEvaluator } from "@/lib/understanding/evaluators";

/**
 * Documents the product copy contract for SDA: risk evaluators produce scores;
 * living-arrangement services must append informational-only language (tested via
 * reason strings in relationship-risk-service — asserted here as constant contract).
 */
describe("Living arrangement / SDA copy contract", () => {
  it("does not emit eligibility language from the default evaluator", async () => {
    const result = await defaultInformalSupportRiskEvaluator.evaluate({
      participantId: "p1",
      informalSupports: [
        {
          id: "s1",
          participantId: "p1",
          supporterDisplayName: "Parent",
          supporterUserId: null,
          relationshipLabel: "parent",
          capacityScore: 20,
          stabilityTrend: "declining",
          notes: null,
        },
      ],
      livingAloneHint: true,
    });
    const serialised = JSON.stringify(result);
    expect(serialised).not.toMatch(/eligib/i);
    expect(serialised).not.toMatch(/approved for SDA/i);
  });
});
