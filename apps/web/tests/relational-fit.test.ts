import { describe, expect, it } from "vitest";

import {
  compareDeclaredPractices,
  DEFAULT_FIT_REQUEST,
  explainFitRisk,
  type DeclaredPractice,
} from "@/lib/support-builder/relational-fit";

const declared: DeclaredPractice = {
  communicationModes: ["text", "aac"],
  routineStyle: "structured",
  interactionStyle: "quiet",
  initiativeStyle: "ask_first",
  continuityStyle: "regular",
};

describe("Relational Fit v1 (preference comparison only)", () => {
  it("matches explicit, worker-declared behaviour with no personality inferences", () => {
    const result = compareDeclaredPractices({
      ...DEFAULT_FIT_REQUEST,
      communicationModes: ["aac"],
      routine: { value: "structured", importance: "essential" },
    }, declared);
    expect(result.fitsEssentialPreferences).toBe(true);
    expect(result.alignsWith).toHaveLength(2);
    expect(result.basis).toBe("participant_preferences_and_worker_declarations_only");
    expect(result).not.toHaveProperty("personalityScore");
    expect(result).not.toHaveProperty("compatibilityPercent");
  });

  it("never compensates a missing required AAC capability with other preferences", () => {
    const result = compareDeclaredPractices({
      ...DEFAULT_FIT_REQUEST,
      communicationModes: ["auslan"],
      routine: { value: "structured", importance: "essential" },
    }, declared);
    expect(result.fitsEssentialPreferences).toBe(false);
    expect(result.unknowns.join(" ")).toContain("auslan");
  });

  it("holds an essential requirement when the worker did not declare it", () => {
    const result = compareDeclaredPractices({
      ...DEFAULT_FIT_REQUEST,
      routine: { value: "structured", importance: "essential" },
    }, { ...declared, routineStyle: "not_stated" });
    expect(result.fitsEssentialPreferences).toBe(false);
    expect(result.unknowns.length).toBe(1);
  });

  it("does not exclude a worker for a non-essential difference", () => {
    const result = compareDeclaredPractices({
      ...DEFAULT_FIT_REQUEST,
      interaction: { value: "conversational", importance: "preferred" },
    }, declared);
    expect(result.fitsEssentialPreferences).toBe(true);
    expect(result.discussBeforeProceeding.length).toBe(1);
  });

  it("allows an explicitly adaptable worker practice without claiming actual success", () => {
    const result = compareDeclaredPractices({
      ...DEFAULT_FIT_REQUEST,
      continuity: { value: "regular", importance: "essential" },
    }, { ...declared, continuityStyle: "adaptable" });
    expect(result.fitsEssentialPreferences).toBe(true);
    expect(result.alignsWith.join(" ")).toContain("self-declares adaptable");
  });

  it("explains uncertainty, worker choice and the role of AI", () => {
    expect(explainFitRisk()).toMatch(/does not measure personality/);
    expect(explainFitRisk()).toMatch(/No worker is assigned/);
    expect(explainFitRisk()).toMatch(/deterministic rules/);
  });
});
