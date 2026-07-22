import { describe, expect, it } from "vitest";

import {
  EXCLUDED_CAPABILITIES,
  MANDATORY_ROLES,
  OPERATIONAL_TARGETS,
  PILOT_STRUCTURE,
  sensitivePilotMutationsAllowed,
  validateOwnerAssignments,
} from "@/lib/pilot/controlled-pilot-baseline";

describe("controlled-pilot baseline", () => {
  it("encodes Decision 1 structure bounds", () => {
    expect(PILOT_STRUCTURE.participantMin).toBe(5);
    expect(PILOT_STRUCTURE.participantMax).toBe(10);
    expect(PILOT_STRUCTURE.region).toBe("NSW");
    expect(PILOT_STRUCTURE.durationWeeks).toBe(4);
    expect(PILOT_STRUCTURE.timezone).toBe("Australia/Sydney");
    expect(PILOT_STRUCTURE.humanReviewBeforeCareOrTransportProgression).toBe(
      true,
    );
  });

  it("encodes Decision 2 operational targets without claiming achievement", () => {
    expect(OPERATIONAL_TARGETS.rtoHours).toBe(4);
    expect(OPERATIONAL_TARGETS.rpoHours).toBe(1);
    expect(OPERATIONAL_TARGETS.backupRetentionDays).toBe(30);
    expect(OPERATIONAL_TARGETS.criticalAlertAckMinutesStaffed).toBe(15);
    expect(OPERATIONAL_TARGETS.rateLimitFailureMode).toBe(
      "fail_closed_sensitive_mutations",
    );
  });

  it("keeps mandatory exclusions including prod CSP and NDIA/payments", () => {
    expect(EXCLUDED_CAPABILITIES).toEqual(
      expect.arrayContaining([
        "ndia_claim_submission",
        "automated_payments",
        "production_csp_enforcement",
        "autonomous_safeguarding",
      ]),
    );
  });

  it("fail-closes empty owner assignments", () => {
    const result = validateOwnerAssignments([]);
    expect(result.ok).toBe(false);
    expect(result.status).toBe("OWNER_ACTION_REQUIRED");
    expect(result.missing.length).toBeGreaterThanOrEqual(
      MANDATORY_ROLES.length,
    );
  });

  it("blocks sensitive mutations without distributed rate limiting", () => {
    expect(
      sensitivePilotMutationsAllowed({ distributedRateLimitVerified: false }),
    ).toBe(false);
    expect(
      sensitivePilotMutationsAllowed({ distributedRateLimitVerified: true }),
    ).toBe(true);
  });
});
