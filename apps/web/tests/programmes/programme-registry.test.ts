import { describe, expect, it } from "vitest";

import { FixtureProgrammeSourceAdapter } from "@/lib/programmes/adapters/fixture-source-adapter";
import {
  assertKnownProgrammeId,
  expectedProgrammeRegistrySeedIds,
  getCompileTimeProgrammeRegistry,
  isKnownProgrammeId,
  navigatorFeedbackRatingSchema,
} from "@/lib/programmes";
import { PROGRAMME_IDS } from "@/lib/programmes/safety-invariants";

describe("programme registry", () => {
  it("compile-time registry matches PROGRAMME_IDS order and ids", () => {
    const seed = expectedProgrammeRegistrySeedIds();
    expect(seed).toEqual([...PROGRAMME_IDS]);
    const registry = getCompileTimeProgrammeRegistry();
    expect(registry.map((r) => r.id)).toEqual([...PROGRAMME_IDS]);
    expect(registry.every((r) => r.label.length > 0)).toBe(true);
  });

  it("assertKnownProgrammeId accepts seeded ids and rejects unknowns", () => {
    expect(isKnownProgrammeId("pathways")).toBe(true);
    expect(isKnownProgrammeId("not_a_programme")).toBe(false);
    expect(() => assertKnownProgrammeId("pathways")).not.toThrow();
    expect(() => assertKnownProgrammeId("not_a_programme")).toThrow(
      /Unknown programme id/,
    );
  });

  it("source search filters by affectedProgrammes containment (GIN-backed has)", async () => {
    // Offline smoke: same containment semantics as Prisma `affectedProgrammes: { has }`.
    const adapter = new FixtureProgrammeSourceAdapter();
    const pathways = await adapter.searchSources({ programmeId: "pathways" });
    expect(pathways.length).toBeGreaterThan(0);
    expect(
      pathways.every((s) => s.affectedProgrammes.includes("pathways")),
    ).toBe(true);
    const kidsOnly = await adapter.searchSources({ programmeId: "kids" });
    expect(kidsOnly).toHaveLength(0);
  });
});

describe("navigator feedback rating schema", () => {
  it("accepts 1–5 and null/undefined", () => {
    expect(navigatorFeedbackRatingSchema.parse(1)).toBe(1);
    expect(navigatorFeedbackRatingSchema.parse(5)).toBe(5);
    expect(navigatorFeedbackRatingSchema.parse(null)).toBeNull();
    expect(navigatorFeedbackRatingSchema.parse(undefined)).toBeUndefined();
  });

  it("rejects out-of-range ratings (mirrors DB CHECK)", () => {
    expect(() => navigatorFeedbackRatingSchema.parse(0)).toThrow();
    expect(() => navigatorFeedbackRatingSchema.parse(6)).toThrow();
    expect(() => navigatorFeedbackRatingSchema.parse(3.5)).toThrow();
  });
});
