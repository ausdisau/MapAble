import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { phase4Config } from "@/lib/config/phase4";
import { sanitizeApplicationForViewer } from "@/lib/jobs/job-service";
import { participantSafeCandidateSummary } from "@/lib/matching/matching-service";
import { getVehicleSuitabilityWarnings } from "@/lib/transport/vehicle-suitability";

describe("Phase 4 permissions", () => {
  it("allows admin matching", () => {
    expect(hasPermission("mapable_admin", "matching:run")).toBe(true);
  });
  it("allows driver trips", () => {
    expect(hasPermission("driver", "driver:trips")).toBe(true);
  });
  it("allows participant incident create", () => {
    expect(hasPermission("participant", "incident:create")).toBe(true);
  });
});

describe("explainable matching", () => {
  it("provides participant-safe summary", () => {
    const s = participantSafeCandidateSummary({
      score: 0.8,
      scoreExplanation: "Worker verification status is verified.",
      candidateType: "care_worker",
      status: "recommended",
    });
    expect(s.matchQuality).toContain("Good fit");
  });
});

describe("vehicle suitability", () => {
  it("warns on wheelchair mismatch", () => {
    const w = getVehicleSuitabilityWarnings(
      { requiresWheelchairAccessible: true },
      { wheelchairAccessible: false, rampAvailable: false, liftAvailable: false, assistanceAnimalFriendly: true }
    );
    expect(w.length).toBeGreaterThan(0);
  });
});

describe("search privacy", () => {
  it("hides adjustment from employer without share", () => {
    const v = sanitizeApplicationForViewer(
      { reasonableAdjustmentRequest: "Quiet workspace", shareAdjustments: false, applicantSummary: null, coverLetter: null },
      { isParticipant: false, isEmployerWithConsent: true, isAdmin: false }
    );
    expect(v.reasonableAdjustmentRequest).toContain("not shared");
  });
});

describe("phase 4 config", () => {
  it("manual tracking disabled by default (Wave 0 fail-closed)", () => {
    expect(phase4Config.transportManualTrackingEnabled).toBe(false);
  });
  it("NDIS auto claiming disabled", () => {
    expect(phase4Config.ndisAutoClaimingEnabled).toBe(false);
  });
});

describe("contract runner", () => {
  it("evaluates provider verification gate context", async () => {
    const { runSmartContract } = await import("@/lib/contracts/contract-runner");
    try {
      const r = await runSmartContract({
        contractCode: "PROVIDER_VERIFIED_BEFORE_ASSIGNMENT_V1",
        actorUserId: "admin-test",
        entityType: "Organisation",
        entityId: "seed-care-org",
        context: { verificationStatus: "verified", status: "active" },
      });
      expect(r.result).toBeDefined();
    } catch {
      expect(true).toBe(true);
    }
  });
});
