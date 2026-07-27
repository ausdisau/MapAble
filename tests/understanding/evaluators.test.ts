import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  defaultInformalSupportRiskEvaluator,
  ensureDefaultRelationshipRiskEvaluators,
  listRelationshipRiskEvaluators,
  registerRelationshipRiskEvaluator,
  __resetDefaultRelationshipRiskRegistrationForTests,
  __resetRelationshipRiskEvaluatorsForTests,
} from "@/lib/understanding/evaluators";
import type { InformalSupportView } from "@/lib/understanding/types";

function support(
  partial: Partial<InformalSupportView> & { capacityScore: number; stabilityTrend: InformalSupportView["stabilityTrend"] },
): InformalSupportView {
  return {
    id: partial.id ?? "s1",
    participantId: "p1",
    supporterDisplayName: partial.supporterDisplayName ?? "Parent",
    supporterUserId: null,
    relationshipLabel: "parent",
    capacityScore: partial.capacityScore,
    stabilityTrend: partial.stabilityTrend,
    notes: null,
  };
}

describe("RelationshipRiskEvaluator heuristics", () => {
  beforeEach(() => {
    __resetRelationshipRiskEvaluatorsForTests();
    __resetDefaultRelationshipRiskRegistrationForTests();
  });

  afterEach(() => {
    __resetRelationshipRiskEvaluatorsForTests();
    __resetDefaultRelationshipRiskRegistrationForTests();
  });

  it("elevates cascading impact when informal supports decline with low capacity", async () => {
    const result = await defaultInformalSupportRiskEvaluator.evaluate({
      participantId: "p1",
      informalSupports: [
        support({ capacityScore: 30, stabilityTrend: "declining" }),
      ],
    });
    expect(result.cascadingImpact).toBeGreaterThanOrEqual(80);
  });

  it("keeps cascading modest for stable high-capacity supports", async () => {
    const result = await defaultInformalSupportRiskEvaluator.evaluate({
      participantId: "p1",
      informalSupports: [
        support({ capacityScore: 90, stabilityTrend: "stable" }),
      ],
    });
    expect(result.cascadingImpact).toBeLessThan(50);
  });

  it("registers default evaluators and accepts custom plugs", () => {
    ensureDefaultRelationshipRiskEvaluators();
    registerRelationshipRiskEvaluator({
      id: "test.custom",
      evaluate: () => ({ cascadingImpact: 99 }),
    });
    const ids = listRelationshipRiskEvaluators().map((e) => e.id);
    expect(ids).toContain("understanding.informal_support_decline");
    expect(ids).toContain("test.custom");
  });
});
