import { describe, expect, it } from "vitest";

import { evaluateObservationFreshness } from "@/lib/access/infrastructure/freshness";
import {
  assertAiCannotBeVerified,
  buildProvenanceDisplay,
  resolveCreateVerificationStatus,
  sourceTypeToSourceClass,
} from "@/lib/access/infrastructure/provenance";

describe("Access Graph provenance (E01)", () => {
  it("maps AI source to ai_inferred and refuses verified storage", () => {
    expect(sourceTypeToSourceClass("ai", [])).toBe("ai_inferred");
    expect(sourceTypeToSourceClass("system", ["computer_vision"])).toBe(
      "ai_inferred",
    );
    expect(
      resolveCreateVerificationStatus({ sourceClass: "ai_inferred" }),
    ).toBe("observed");
    expect(() =>
      assertAiCannotBeVerified({
        sourceType: "ai",
        evidenceKinds: ["ai_inferred"],
        verificationStatus: "verified",
      }),
    ).toThrow(/cannot be stored as independently verified/i);
  });

  it("labels AI display as unverified", () => {
    const display = buildProvenanceDisplay({
      sourceType: "ai",
      evidenceKinds: ["ai_inferred"],
      verificationStatus: "observed",
      freshnessExpired: false,
    });
    expect(display.sourceClass).toBe("ai_inferred");
    expect(display.displayLabel).toMatch(/unverified/i);
    expect(display.unverified).toBe(true);
    expect(display.aiInferred).toBe(true);
    expect(display.unknownNotInaccessible).toBe(true);
  });

  it("marks expired observations with expired source class", () => {
    const display = buildProvenanceDisplay({
      sourceType: "community",
      evidenceKinds: ["photo"],
      verificationStatus: "community_reported",
      freshnessExpired: true,
    });
    expect(display.sourceClass).toBe("expired");
    expect(display.verificationStatus).toBe("outdated");
    expect(display.unverified).toBe(true);
  });

  it("maps assessor and community sources correctly", () => {
    expect(sourceTypeToSourceClass("trained_assessor")).toBe(
      "assessor_measured",
    );
    expect(sourceTypeToSourceClass("community")).toBe("community_reported");
    expect(sourceTypeToSourceClass("venue")).toBe("organisation_supplied");
    expect(
      resolveCreateVerificationStatus({
        sourceClass: "community_reported",
      }),
    ).toBe("community_reported");
  });
});

describe("Access Graph freshness (E01)", () => {
  it("marks lift status expired after 24h", () => {
    const observedAt = new Date("2026-08-10T00:00:00.000Z");
    const now = new Date("2026-08-12T00:00:00.000Z");
    const result = evaluateObservationFreshness({
      ontologyConceptId: "physical.lift_operational",
      observedAt,
      now,
    });
    expect(result.policyKey).toBe("lift_status");
    expect(result.expired).toBe(true);
    expect(result.state).toBe("expired");
  });

  it("keeps door width fresh within annual window", () => {
    const observedAt = new Date("2026-01-01T00:00:00.000Z");
    const now = new Date("2026-08-12T00:00:00.000Z");
    const result = evaluateObservationFreshness({
      ontologyConceptId: "physical.minimum_clear_width_mm",
      observedAt,
      now,
    });
    expect(result.policyKey).toBe("door_width");
    expect(result.expired).toBe(false);
    expect(result.state).toBe("fresh");
  });

  it("honours explicit reviewDue as expiry", () => {
    const observedAt = new Date("2026-08-12T00:00:00.000Z");
    const reviewDue = new Date("2026-08-12T01:00:00.000Z");
    const now = new Date("2026-08-12T02:00:00.000Z");
    const result = evaluateObservationFreshness({
      ontologyConceptId: "physical.step_free",
      observedAt,
      reviewDue,
      now,
    });
    expect(result.expired).toBe(true);
    expect(result.expiresAt).toBe(reviewDue.toISOString());
  });
});
