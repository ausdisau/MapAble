import { describe, expect, it } from "vitest";

import {
  applicationPreflightService,
  documentChecklistService,
  programmeExportService,
  resetProgrammeFoundationStoresForTests,
  validateAuraProposalBoundary,
} from "@/lib/programmes";
import { programmeFoundationFixtures } from "@/tests/fixtures/programme-foundation";

describe("accessible non-chat workflow foundation", () => {
  resetProgrammeFoundationStoresForTests();

  it("builds a document checklist with unknown preservation", async () => {
    const checklist = await documentChecklistService.buildChecklist({
      programmeId: "pathways",
      jurisdiction: "AU-NSW",
    });

    expect(checklist.some((item) => item.status === "unknown")).toBe(true);
    expect(checklist.some((item) => item.required)).toBe(true);
  });

  it("blocks preflight when eligibility claim is present", async () => {
    const result = await applicationPreflightService.runPreflight({
      programmeId: "pathways",
      participantId: programmeFoundationFixtures.participantId,
      applicationType: "pathway_exploration",
      payload: { eligibilityClaim: true },
    });

    expect(result.requiresHumanDecision).toBe(true);
    expect(result.canProceed).toBe(false);
  });

  it("generates offline export pack with non-AI contacts", async () => {
    const pack = await programmeExportService.generateOfflinePack({
      programmeId: "pathways",
      participantId: programmeFoundationFixtures.participantId,
    });

    expect(pack.nonAiContacts.length).toBeGreaterThan(0);
    expect(pack.sections.some((s) => s.isUnknown)).toBe(true);
  });

  it("allows explain-only AURA actions in preflight path", () => {
    expect(() =>
      validateAuraProposalBoundary({ action: "explain" }),
    ).not.toThrow();
  });
});
