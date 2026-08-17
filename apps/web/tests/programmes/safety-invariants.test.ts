import { describe, expect, it } from "vitest";

import {
  PROGRAMME_INVARIANTS,
  ProgrammeInvariantError,
  assertDisclosureScope,
  assertProgrammeInvariant,
  assertUnknownPreserved,
  validateAuraProposalBoundary,
} from "@/lib/programmes/safety-invariants";
import { forbiddenAuraActions } from "@/tests/fixtures/programme-foundation";

describe("programme safety invariants", () => {
  it("defines all 20 invariants", () => {
    expect(Object.keys(PROGRAMME_INVARIANTS)).toHaveLength(20);
  });

  it("throws when invariant condition fails", () => {
    expect(() =>
      assertProgrammeInvariant(
        "participant_primary_decision_maker",
        false,
        "Participant must remain primary decision-maker",
      ),
    ).toThrow(ProgrammeInvariantError);
  });

  it("rejects forbidden AURA actions", () => {
    for (const action of forbiddenAuraActions) {
      expect(() => validateAuraProposalBoundary({ action })).toThrow(
        ProgrammeInvariantError,
      );
    }
  });

  it("rejects diagnosis inference in AURA text", () => {
    expect(() =>
      validateAuraProposalBoundary({
        action: "explain",
        textContent: "Based on your autism diagnosis you are NDIS eligible",
      }),
    ).toThrow(ProgrammeInvariantError);
  });

  it("requires participant approval for referral drafts", () => {
    expect(() =>
      validateAuraProposalBoundary({
        action: "draft_referral",
        requiresParticipantApproval: false,
      }),
    ).toThrow(ProgrammeInvariantError);
  });

  it("preserves unknown values", () => {
    expect(assertUnknownPreserved(null)).toBe("unknown");
    expect(assertUnknownPreserved("")).toBe("unknown");
    expect(assertUnknownPreserved("value")).toBe("known");
  });

  it("requires recipient, purpose and fields for disclosure", () => {
    expect(() =>
      assertDisclosureScope({
        recipientId: "user-1",
        purpose: "navigator_assistance",
        fields: ["goals"],
      }),
    ).not.toThrow();

    expect(() =>
      assertDisclosureScope({
        recipientId: "user-1",
        purpose: "navigator_assistance",
        fields: [],
      }),
    ).toThrow(ProgrammeInvariantError);
  });
});
