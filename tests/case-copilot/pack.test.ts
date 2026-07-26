import { beforeEach, describe, expect, it } from "vitest";

import {
  buildCaseCopilotPack,
  caseCopilotProhibitedActions,
} from "@/lib/ai/case-copilot";
import type { CaseSnapshot } from "@/lib/cases/ai/types";

function snapshot(overrides: Partial<CaseSnapshot> = {}): CaseSnapshot {
  return {
    id: "case-1",
    reference: "CASE-100",
    title: "Transport access concern",
    description: "Lift access was unclear during the visit.",
    status: "open",
    priority: "medium",
    category: "safeguarding",
    riskLevel: "moderate",
    openedAt: new Date("2026-07-01T10:00:00.000Z"),
    dueAt: new Date("2026-07-20T10:00:00.000Z"),
    closedAt: null,
    participantId: "p1",
    assignedToId: "c1",
    notes: [
      {
        id: "n1",
        body: "Participant says: the lift was out of service.",
        createdAt: new Date("2026-07-02T10:00:00.000Z"),
        pinned: false,
      },
      {
        id: "n2",
        body: "Provider says: the lift was working that morning.",
        createdAt: new Date("2026-07-02T12:00:00.000Z"),
        pinned: false,
      },
    ],
    tasks: [
      {
        id: "t1",
        title: "Collect building maintenance log",
        status: "open",
        dueAt: new Date("2026-07-10T10:00:00.000Z"),
        completedAt: null,
      },
    ],
    tags: [],
    ...overrides,
  };
}

describe("Case Copilot", () => {
  beforeEach(() => {
    process.env.MAPABLE_CASE_COPILOT_ENABLED = "true";
  });

  it("keeps prohibited operational actions", () => {
    expect(caseCopilotProhibitedActions()).toContain("close_case");
    expect(caseCopilotProhibitedActions()).toContain("determine_allegation");
  });

  it("separates conflicting accounts and does not flatten narrative", () => {
    const pack = buildCaseCopilotPack(snapshot());
    expect("disabled" in pack).toBe(false);
    if ("disabled" in pack) return;
    expect(pack.actionTaken).toBe(false);
    expect(pack.humanReviewRequired).toBe(true);
    expect(pack.conflictingAccounts.length).toBeGreaterThan(0);
    expect(pack.sourceSeparatedSummary.participant_says.length).toBeGreaterThan(0);
    expect(pack.sourceSeparatedSummary.provider_says.length).toBeGreaterThan(0);
    expect(
      pack.sourceSeparatedSummary.mapable_cannot_determine.length
    ).toBeGreaterThan(0);
    expect(pack.deterministicRisk.separatedFromNarrative).toBe(true);
    expect(pack.chronology.length).toBeGreaterThan(2);
    expect(pack.correctionWorkflow.state).toBe("suggestion_generated");
  });

  it("lists evidence gaps and deadlines", () => {
    const pack = buildCaseCopilotPack(
      snapshot({ dueAt: null, notes: [], participantId: null })
    );
    if ("disabled" in pack) return;
    expect(pack.evidenceGaps.length).toBeGreaterThan(0);
    expect(pack.deadlines.some((d) => d.citationId.startsWith("task:"))).toBe(
      true
    );
  });
});
