import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { evaluateToolAction } from "@/lib/aura-harness/evaluate-action";
import { __resetAuraMemoryForTests } from "@/lib/aura-harness/memory-store";
import {
  evaluateAccreditationBridge,
  evaluateRecogniseContext,
  registerRiskCriterionEvaluator,
  __resetDefaultAutonomyRegistrationForTests,
  __resetRiskCriterionEvaluatorsForTests,
} from "@/lib/aura-harness/recognise";
import { gammaCalculator } from "@/lib/aura-harness/gamma-calculator";
import {
  applyRecogniseToContexts,
} from "@/lib/aura-harness/recognise/pipeline";
import { extractSemanticScores } from "@/lib/aura-harness/semantic-judge";
import { resolvePolicyAction } from "@/lib/aura-harness/policy-engine";

describe("Recognise autonomy criteria", () => {
  beforeEach(() => {
    __resetAuraMemoryForTests();    __resetRiskCriterionEvaluatorsForTests();
    __resetDefaultAutonomyRegistrationForTests();
  });

  afterEach(() => {
    __resetRiskCriterionEvaluatorsForTests();
    __resetDefaultAutonomyRegistrationForTests();
    __resetAuraMemoryForTests();  });

  it("scores routine search autonomy as low/uniform", async () => {
    const rec = await evaluateRecogniseContext("searchNdisProviders", {
      q: "physio",
    });
    expect(rec.autonomy.capabilityDependence).toBe(12);
    expect(rec.autonomy.irreversibility).toBe(12);
    expect(rec.autonomy.cascadingImpact).toBe(12);
    expect(rec.evaluatorIds.length).toBeGreaterThanOrEqual(3);
  });

  it("scores delete as high irreversibility / cascading (aligned floor)", async () => {
    const rec = await evaluateRecogniseContext("delete_user_account", {
      user_id: 1,
    });
    expect(rec.autonomy.irreversibility).toBe(90);
    expect(rec.autonomy.cascadingImpact).toBe(90);
  });

  it("escalates batch cancel to HITL via autonomy even when gamma is modest", async () => {
    const base = extractSemanticScores("batch_cancel_bookings", {
      batch: true,
      allParticipants: true,
    });
    const draft = gammaCalculator.calculateProfile(base);
    const rec = await evaluateRecogniseContext(
      "batch_cancel_bookings",
      { batch: true, allParticipants: true },
      draft,
    );
    expect(rec.autonomy.cascadingImpact).toBeGreaterThanOrEqual(80);
    const merged = applyRecogniseToContexts(base, rec);
    const profile = gammaCalculator.calculateProfile(merged);
    const matrix = resolvePolicyAction(profile);
    // Autonomy hint should request HITL when cascading is acute.
    expect(rec.policyHint === "REQUIRE_HITL" || matrix === "REQUIRE_HITL").toBe(
      true,
    );
  });

  it("accreditation bridge is no-op without venue scores", () => {
    expect(evaluateAccreditationBridge({ q: "physio" })).toBeNull();
  });

  it("accreditation bridge maps low venue score to accessibility risk", () => {
    const hint = evaluateAccreditationBridge({
      venueAccessibilityScore: 25,
    });
    expect(hint?.tier).toBe("not_accredited");
    expect(hint?.accessibilityRiskScore).toBeGreaterThanOrEqual(80);
  });

  it("accreditation gold does not spike accessibility risk", () => {
    const hint = evaluateAccreditationBridge({
      accreditationTotalScore: 95,
    });
    expect(hint?.tier).toBe("gold");
    expect(hint?.accessibilityRiskScore).toBeLessThanOrEqual(15);
  });

  it("custom evaluator participates in scoring", async () => {
    registerRiskCriterionEvaluator({
      id: "test.custom",
      evaluate: () => ({ cascadingImpact: 99 }),
    });
    // Defaults still need registration
    const rec = await evaluateRecogniseContext("searchNdisProviders", {
      q: "x",
    });
    expect(rec.evaluatorIds).toContain("test.custom");
    expect(rec.autonomy.cascadingImpact).toBe(99);
  });

  it("evaluateToolAction attaches recognise audit on approve", async () => {
    const result = await evaluateToolAction("searchNdisProviders", {
      q: "physio",
    });
    expect(result.decision.outcome).toBe("APPROVED");
    expect(result.decision.recognise?.evaluatorIds.length).toBeGreaterThan(0);
    expect(result.decision.recognise?.autonomy.capabilityDependence).toBe(12);
  });
});
