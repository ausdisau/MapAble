import { describe, expect, it } from "vitest";

import {
  evaluateDriverEligibility,
  evaluateRouteFeasibility,
  evaluateVehicleEligibility,
  proposeDisruptionRecovery,
  transportRequirementsSchema,
} from "@mapable/domain-transport";

const requirements = transportRequirementsSchema.parse({
  requiresWheelchairAccessible: true,
  requiresRamp: true,
  requiredCommunicationCapabilities: ["plain_language"],
});

describe("CSI transport domain policy", () => {
  it("fails closed for missing vehicle access evidence", () => {
    const result = evaluateVehicleEligibility({
      vehicle: { id: "vehicle", active: true, features: null, verifications: [] },
      requirements,
      now: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes).toContain("ACCESSIBILITY_EVIDENCE_MISSING");
  });

  it("rejects expired driver credentials", () => {
    const result = evaluateDriverEligibility({
      driver: {
        id: "driver",
        active: true,
        communicationCapabilities: ["plain_language"],
        verifications: [
          { kind: "licence", status: "verified", expiresAt: "2025-01-01T00:00:00.000Z" },
          { kind: "screening", status: "verified", expiresAt: null },
          { kind: "training", status: "verified", expiresAt: null },
        ],
      },
      requirements,
      now: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(result.eligible).toBe(false);
    expect(result.reasonCodes).toContain("CREDENTIAL_EXPIRED");
  });

  it("rejects stale route evidence and participant mismatches", () => {
    const result = evaluateRouteFeasibility({
      participantId: "participant-a",
      requestedParticipantId: "participant-b",
      routeEvidenceAt: "2026-01-01T00:00:00.000Z",
      pickupWindowStart: "2026-01-02T10:00:00.000Z",
      routeDurationMinutes: 60,
      now: new Date("2026-01-01T03:00:00.000Z"),
    });
    expect(result.feasible).toBe(false);
    expect(result.reasonCodes).toEqual(
      expect.arrayContaining(["PARTICIPANT_MISMATCH", "ROUTE_EVIDENCE_STALE"])
    );
  });

  it("only proposes recovery and never changes operations", () => {
    expect(
      proposeDisruptionRecovery({
        disruption: "transport_cancellation",
        hasCompliantAlternative: false,
      })
    ).toEqual({
      outcome: "ESCALATE",
      reasonCodes: ["NO_FEASIBLE_OPTION", "HUMAN_RECOVERY_REVIEW_REQUIRED"],
      noOperationalChangeMade: true,
    });
  });
});
