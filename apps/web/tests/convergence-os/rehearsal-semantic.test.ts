import { describe, expect, it } from "vitest";
import { SEMANTIC_CANDIDATE_SEEDS } from "@/lib/platform/convergence-os/semantic/resolver";
import { FOUNDATION_MERGE_TRAIN } from "@/lib/platform/convergence-os/trains/foundation-merge-train";

describe("Semantic resolver seeds", () => {
  it("includes known collision pairs without auto-merge authority", () => {
    expect(SEMANTIC_CANDIDATE_SEEDS.length).toBeGreaterThanOrEqual(5);
    expect(
      SEMANTIC_CANDIDATE_SEEDS.some((c) => c.candidateKey === "case_vs_careos_mission")
    ).toBe(true);
    expect(
      SEMANTIC_CANDIDATE_SEEDS.every((c) => {
        const evidence = c.evidenceJson as { vectorSimilarityAlone?: boolean };
        return evidence.vectorSimilarityAlone !== true;
      })
    ).toBe(true);
  });
});

describe("Rehearsal lab constraints", () => {
  it("foundation train key is stable for rehearsal binding", () => {
    expect(FOUNDATION_MERGE_TRAIN.trainKey).toBe(
      "foundation_governance_prep_v1"
    );
  });
});
