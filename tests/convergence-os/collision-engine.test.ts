import { describe, expect, it } from "vitest";

import {
  analyseSchemaCollisions,
  isRelatedProjectionPair,
  MAIN_INDOOR_MODELS,
  modelsAreIdentical,
  SCHEMA_REF_FIXTURES,
} from "@/lib/convergence-os/schema/collision-engine";

describe("analyseSchemaCollisions", () => {
  const findings = analyseSchemaCollisions();

  it("detects CareOSMission multi-writer as critical", () => {
    const hit = findings.find((f) => f.collisionKey === "multi_writer_CareOSMission");
    expect(hit).toBeTruthy();
    expect(hit?.severity).toBe("critical");
    expect(hit?.affectedBranches).toEqual(
      expect.arrayContaining(["careos", "aura", "continuity"])
    );
    expect(hit?.manualDecisionRequired).toBe(true);
  });

  it("detects PersonalVault dual-define between vault and rightsos", () => {
    const hit = findings.find(
      (f) => f.collisionKey === "vault_rightsos_personal_vault"
    );
    expect(hit?.severity).toBe("critical");
    expect(hit?.canonicalRecommendation).toMatch(/#281/);
  });

  it("detects migration timestamp 20260716140000 collision", () => {
    const hit = findings.find(
      (f) => f.collisionKey === "migration_ts_20260716140000"
    );
    expect(hit).toBeTruthy();
    expect(hit?.severity).toBe("critical");
    expect(hit?.category).toBe("migration_timestamp_collision");
  });

  it("flags indoor deletion on aura tip", () => {
    const hit = findings.find(
      (f) => f.collisionKey === "indoor_deletion_aura"
    );
    expect(hit).toBeTruthy();
    expect(hit?.affectedModels?.length).toBeGreaterThan(0);
  });

  it("classifies CivicAsset vs AccessibilityAsset as related projection not silent duplicate merge", () => {
    const hit = findings.find(
      (f) => f.collisionKey === "asset_related_projection_civic_a11yops"
    );
    expect(hit?.category).toBe("related_projection");
    expect(hit?.severity).toBe("warning");
    expect(isRelatedProjectionPair("CivicAsset", "AccessibilityAsset")).toBe(
      true
    );
  });

  it("distinguishes Case vs CareOSMission as same concept different names", () => {
    const hit = findings.find((f) => f.collisionKey === "case_vs_careos_mission");
    expect(hit?.category).toBe("same_concept_different_names");
    expect(isRelatedProjectionPair("Case", "CareOSMission")).toBe(true);
  });

  it("identifies identical model name lists", () => {
    expect(modelsAreIdentical(["A", "B"], ["B", "A"])).toBe(true);
    expect(modelsAreIdentical(["A"], ["A", "B"])).toBe(false);
  });

  it("includes main indoor models in fixtures baseline", () => {
    const main = SCHEMA_REF_FIXTURES.find((r) => r.refLabel === "main");
    expect(main?.modelNames).toEqual(
      expect.arrayContaining(["AccessFloorPlan", "VisitPlan"])
    );
    expect(MAIN_INDOOR_MODELS).toContain("AccessFloorPlan");
  });
});
