import { describe, expect, it } from "vitest";

import { buildDimensions } from "@/lib/aura-harness/dimensions";
import { GammaCalculator } from "@/lib/aura-harness/gamma-calculator";
import { resolvePolicyAction } from "@/lib/aura-harness/policy-engine";
import type { ActionContext } from "@/lib/aura-harness/types";

describe("GammaCalculator", () => {
  const calc = new GammaCalculator();

  it("throws when total weight is zero", () => {
    const contexts: ActionContext[] = [
      {
        contextId: "empty",
        targetTool: "x",
        dimensions: [{ id: "privacy", weight: 0, score: 50 }],
      },
    ];
    expect(() => calc.calculateProfile(contexts)).toThrow(/Zero dimension weight/);
  });

  it("returns weighted-average gamma on 0–100 with U_tot = Σ w", () => {
    const contexts: ActionContext[] = [
      {
        contextId: "c1",
        targetTool: "t",
        dimensions: [
          { id: "privacy", weight: 2, score: 100 },
          { id: "fairness", weight: 2, score: 0 },
        ],
      },
    ];
    const profile = calc.calculateProfile(contexts);
    expect(profile.rawGamma).toBe(200);
    expect(profile.normalizedGamma).toBe(50);
    expect(profile.variance).toBe(2500);
    expect(profile.concentrationCoeff).toBeCloseTo(200 * Math.sqrt(2500), 5);
  });

  const uniform = (score: number) =>
    buildDimensions({
      privacy: score,
      fairness: score,
      accountability: score,
      transparency: score,
      human_oversight: score,
      accessibility_representation: score,
      medical_data_exposure: score,
      capability_dependence: score,
      irreversibility: score,
      cascading_impact: score,
    });

  it("maps Low/Low when scores are uniform and modest", () => {
    const contexts: ActionContext[] = [
      { contextId: "c1", targetTool: "t", dimensions: uniform(12) },
    ];
    const profile = calc.calculateProfile(contexts);
    expect(profile.normalizedGamma).toBe(12);
    expect(profile.concentrationCoeff).toBe(0);
    expect(resolvePolicyAction(profile)).toBe("APPROVE");
  });

  it("maps High/Low to DENY for uniformly high scores", () => {
    const contexts: ActionContext[] = [
      { contextId: "c1", targetTool: "t", dimensions: uniform(90) },
    ];
    const profile = calc.calculateProfile(contexts);
    expect(profile.highGamma).toBe(true);
    expect(profile.highConcentration).toBe(false);
    expect(resolvePolicyAction(profile)).toBe("DENY");
  });

  it("maps Low/High to MITIGATE for a privacy spike", () => {
    const contexts: ActionContext[] = [
      {
        contextId: "c1",
        targetTool: "t",
        dimensions: buildDimensions({
          privacy: 98,
          fairness: 12,
          accountability: 12,
          transparency: 12,
          human_oversight: 12,
          accessibility_representation: 12,
          medical_data_exposure: 12,
          capability_dependence: 12,
          irreversibility: 12,
          cascading_impact: 12,
        }),
      },
    ];
    const profile = calc.calculateProfile(contexts);
    expect(profile.highGamma).toBe(false);
    expect(profile.highConcentration).toBe(true);
    expect(resolvePolicyAction(profile)).toBe("MITIGATE");
  });

  it("maps High/High to REQUIRE_HITL", () => {
    const contexts: ActionContext[] = [
      {
        contextId: "c1",
        targetTool: "t",
        dimensions: buildDimensions({
          privacy: 99,
          medical_data_exposure: 99,
          fairness: 70,
          accountability: 80,
          transparency: 70,
          human_oversight: 82,
          accessibility_representation: 70,
          capability_dependence: 70,
          irreversibility: 70,
          cascading_impact: 70,
        }),
      },
    ];
    const profile = calc.calculateProfile(contexts);
    expect(profile.highGamma).toBe(true);
    expect(profile.highConcentration).toBe(true);
    expect(resolvePolicyAction(profile)).toBe("REQUIRE_HITL");
  });
});
