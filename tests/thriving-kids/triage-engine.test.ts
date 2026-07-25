import { describe, expect, it } from "vitest";

import { isThrivingKidsTriageEnabled } from "@/lib/config/thriving-kids";
import {
  ageInCompletedYears,
  determineChildRoutingPathway,
} from "@/lib/intake/triage-engine";
import {
  ThrivingKidsTriageSchema,
  type ThrivingKidsTriageData,
} from "@/lib/schemas/thriving-kids-triage";

function basePayload(
  overrides: {
    participantId?: string;
    dateOfBirth?: string;
    hasFormalDiagnosis?: boolean;
    primaryPresentingConcern?: ThrivingKidsTriageData["primaryPresentingConcern"];
    functionalCapacity?: Partial<ThrivingKidsTriageData["functionalCapacity"]>;
  } = {}
): ThrivingKidsTriageData {
  return {
    participantId: overrides.participantId ?? "participant-child-1",
    dateOfBirth: overrides.dateOfBirth ?? "2019-01-15",
    hasFormalDiagnosis: overrides.hasFormalDiagnosis ?? true,
    primaryPresentingConcern: overrides.primaryPresentingConcern ?? "AUTISM",
    functionalCapacity: {
      communication: 2,
      interpersonalInteractions: 2,
      learningAndApplyingKnowledge: 2,
      mobility: 1,
      selfCare: 2,
      behavioralSelfRegulation: 2,
      ...overrides.functionalCapacity,
    },
  };
}

describe("ThrivingKidsTriageSchema", () => {
  it("accepts a valid payload", () => {
    const parsed = ThrivingKidsTriageSchema.safeParse(basePayload());
    expect(parsed.success).toBe(true);
  });

  it("rejects score 0 and score 6", () => {
    expect(
      ThrivingKidsTriageSchema.safeParse(
        basePayload({ functionalCapacity: { communication: 0 } })
      ).success
    ).toBe(false);
    expect(
      ThrivingKidsTriageSchema.safeParse(
        basePayload({ functionalCapacity: { mobility: 6 } })
      ).success
    ).toBe(false);
  });

  it("rejects invalid presenting concern", () => {
    const parsed = ThrivingKidsTriageSchema.safeParse({
      ...basePayload(),
      primaryPresentingConcern: "ADHD",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("ageInCompletedYears", () => {
  it("computes completed years on UTC calendar", () => {
    expect(
      ageInCompletedYears("2017-07-25", new Date("2026-07-25T12:00:00.000Z"))
    ).toBe(9);
    expect(
      ageInCompletedYears("2018-07-25", new Date("2026-07-25T12:00:00.000Z"))
    ).toBe(8);
  });
});

describe("determineChildRoutingPathway", () => {
  const at = new Date("2026-07-25T12:00:00.000Z");

  it("routes age 9 to STANDARD_NDIS_PATHWAY", () => {
    const result = determineChildRoutingPathway(
      basePayload({ dateOfBirth: "2017-01-01" }),
      at
    );
    expect(result.pathway).toBe("STANDARD_NDIS_PATHWAY");
    expect(result.requiresNdisApplication).toBe(true);
    expect(result.ageYears).toBe(9);
  });

  it("routes age 7 autism with scores <=3 to THRIVING_KIDS_STATE_SUPPORT", () => {
    const result = determineChildRoutingPathway(
      basePayload({
        dateOfBirth: "2019-03-01",
        primaryPresentingConcern: "AUTISM",
      }),
      at
    );
    expect(result.ageYears).toBe(7);
    expect(result.pathway).toBe("THRIVING_KIDS_STATE_SUPPORT");
    expect(result.requiresNdisApplication).toBe(false);
    expect(result.notice).toMatch(/draft routing guidance/i);
  });

  it("routes age 7 autism with one score 4 to NDIS_EARLY_CHILDHOOD_APPROACH", () => {
    const result = determineChildRoutingPathway(
      basePayload({
        dateOfBirth: "2019-03-01",
        primaryPresentingConcern: "AUTISM",
        functionalCapacity: { behavioralSelfRegulation: 4 },
      }),
      at
    );
    expect(result.pathway).toBe("NDIS_EARLY_CHILDHOOD_APPROACH");
    expect(result.maxDomainScore).toBe(4);
    expect(result.requiresNdisApplication).toBe(true);
  });

  it("routes physical disability with low scores to NDIS_EARLY_CHILDHOOD_APPROACH", () => {
    const result = determineChildRoutingPathway(
      basePayload({
        dateOfBirth: "2021-01-01",
        primaryPresentingConcern: "PHYSICAL_DISABILITY",
        functionalCapacity: {
          communication: 1,
          interpersonalInteractions: 1,
          learningAndApplyingKnowledge: 1,
          mobility: 3,
          selfCare: 2,
          behavioralSelfRegulation: 1,
        },
      }),
      at
    );
    expect(result.ageYears).toBe(5);
    expect(result.pathway).toBe("NDIS_EARLY_CHILDHOOD_APPROACH");
  });

  it("keeps exactly age 8 on Thriving Kids when scores and concern qualify", () => {
    const result = determineChildRoutingPathway(
      basePayload({
        dateOfBirth: "2018-07-25",
        primaryPresentingConcern: "DEVELOPMENTAL_DELAY",
      }),
      at
    );
    expect(result.ageYears).toBe(8);
    expect(result.pathway).toBe("THRIVING_KIDS_STATE_SUPPORT");
  });
});

describe("isThrivingKidsTriageEnabled", () => {
  it("defaults off when env is unset", () => {
    const previous = process.env.MAPABLE_THRIVING_KIDS_TRIAGE_ENABLED;
    delete process.env.MAPABLE_THRIVING_KIDS_TRIAGE_ENABLED;
    expect(isThrivingKidsTriageEnabled()).toBe(false);
    if (previous === undefined) {
      delete process.env.MAPABLE_THRIVING_KIDS_TRIAGE_ENABLED;
    } else {
      process.env.MAPABLE_THRIVING_KIDS_TRIAGE_ENABLED = previous;
    }
  });
});
