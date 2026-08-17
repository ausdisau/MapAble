import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PROGRAMME_AURA_CEILING,
  __resetProgrammeAuraStopForTests,
  assertCrossParticipantDenied,
  assertCrossTenantDenied,
  assertProgrammeExecutionEligibility,
  assertProposalOnlyModelBoundary,
  getCaseMissionAdapter,
  getPlatformAssuranceSourceAdapter,
  getProgrammeAccessPassportAdapter,
  getProgrammePlaceAdapter,
  isProgrammeAuraStopped,
  refuseDirectAuraWriter,
  sanitiseProgrammeAuditMetadata,
  stopProgrammeAura,
  __setProgrammeAccessPassportAdapterForTests,
} from "@/lib/programmes";
import { ProgrammeInvariantError } from "@/lib/programmes/safety-invariants";

vi.mock("@/lib/programmes/authority/participant-authority-service", () => ({
  evaluateParticipantAuthority: vi.fn(
    async (input: { actorUserId: string; participantId: string }) => {
      if (input.actorUserId === input.participantId) {
        return { allowed: true, reason: "self" };
      }
      return { allowed: false, reason: "no grant" };
    },
  ),
}));

describe("Prompt 0 current-main compatibility", () => {
  afterEach(() => {
    __resetProgrammeAuraStopForTests();
    __setProgrammeAccessPassportAdapterForTests(null);
  });

  it("mission adapter is interim Case bridge and CareOSMission is not a write target", () => {
    const adapter = getCaseMissionAdapter();
    expect(adapter.isMock).toBe(false);
    expect((adapter as { interimLabel?: string }).interimLabel).toBe(
      "Case_bridge_CareOSMission_absent",
    );
  });

  it("forbids AccessiblePlace programme creates", () => {
    const place = getProgrammePlaceAdapter();
    expect(place.writeTarget).toBe("AccessPlace");
    expect(() => place.assertCanCreatePlaceRecord("AccessiblePlace")).toThrow(
      /must not create AccessiblePlace/,
    );
    expect(() => place.assertCanCreatePlaceRecord("AccessPlace")).not.toThrow();
  });

  it("passport adapter uses AccessibilityProfile/Communication Passport source label", () => {
    const passport = getProgrammeAccessPassportAdapter();
    expect(passport.isMock).toBe(false);
    expect(passport.sourceLabel).toMatch(/AccessibilityProfile/);
  });

  it("source registry ownership stays on programme spine with deferred assurance adapter", () => {
    const assurance = getPlatformAssuranceSourceAdapter();
    expect(assurance.productionReady).toBe(false);
    const link = assurance.linkProgrammeSource({
      programmeSourceRecordId: "src-1",
      regulatorySourceVersionId: "reg-future",
    });
    expect(link.ownership).toBe("programme_evidence_spine");
    expect(link.assuranceAdapter).toBe("future_platform_assurance");
  });

  it("proposal-only model boundary allows explain and refuses eligibility", () => {
    expect(() =>
      assertProposalOnlyModelBoundary({ action: "explain" }),
    ).not.toThrow();
    expect(() =>
      assertProposalOnlyModelBoundary({ action: "decide_eligibility" }),
    ).toThrow(ProgrammeInvariantError);
  });

  it("direct writer refusal blocks book/pay/publish", () => {
    expect(() => refuseDirectAuraWriter("book")).toThrow(/Direct AURA/);
    expect(() => refuseDirectAuraWriter("pay")).toThrow(/Direct AURA/);
    expect(() => refuseDirectAuraWriter("publish")).toThrow(/Direct AURA/);
  });

  it("stop state blocks programme execution eligibility", async () => {
    expect(isProgrammeAuraStopped()).toBe(false);
    stopProgrammeAura();
    expect(isProgrammeAuraStopped()).toBe(true);
    await expect(
      assertProgrammeExecutionEligibility({
        participantId: "p1",
        actorUserId: "p1",
        action: "view_checklist",
      }),
    ).rejects.toThrow(/stop is active/);
  });

  it("participant authority required for non-self actors", async () => {
    __resetProgrammeAuraStopForTests();
    await expect(
      assertProgrammeExecutionEligibility({
        participantId: "p1",
        actorUserId: "supporter-1",
        action: "view_checklist",
      }),
    ).rejects.toThrow(ProgrammeInvariantError);

    await expect(
      assertProgrammeExecutionEligibility({
        participantId: "p1",
        actorUserId: "p1",
        action: "view_checklist",
      }),
    ).resolves.toBeUndefined();
  });

  it("cross-tenant and cross-participant denials", () => {
    expect(() =>
      assertCrossTenantDenied({
        actorOrganisationId: "org-a",
        resourceOrganisationId: "org-b",
      }),
    ).toThrow(/Cross-organisation/);

    expect(() =>
      assertCrossParticipantDenied({
        actorUserId: "u2",
        participantId: "p1",
        hasGrant: false,
      }),
    ).toThrow(/Cross-participant/);
  });

  it("audit metadata strips sensitive programme payloads", () => {
    const cleaned = sanitiseProgrammeAuditMetadata({
      purpose: "visit_prep",
      diagnosis: "secret",
      freeText: "should drop",
      correlationHint: "ok",
    });
    expect(cleaned).toEqual({
      purpose: "visit_prep",
      correlationHint: "ok",
    });
  });

  it("programme AURA ceiling is participant-approval suggest, not execute", () => {
    expect(PROGRAMME_AURA_CEILING).toBe("SUGGEST_WITH_PARTICIPANT_APPROVAL");
  });
});
