import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import { nextActions } from "@/lib/cases/ai/next-actions";
import { searchCases } from "@/lib/cases/ai/nl-search";
import { classifyRisk } from "@/lib/cases/ai/risk-classifier";
import { summarise } from "@/lib/cases/ai/summary-generator";
import type { CaseSnapshot } from "@/lib/cases/ai/types";
import {
  canUserAccessCase,
  canUserManageCase,
  caseListWhereForUser,
} from "@/lib/cases/case-access";

function baseSnapshot(overrides: Partial<CaseSnapshot> = {}): CaseSnapshot {
  return {
    id: "c1",
    reference: "CASE-1",
    title: "Housing review",
    description: "Participant lives in shared housing.",
    status: "open",
    priority: "medium",
    category: "housing",
    riskLevel: "low",
    openedAt: new Date(),
    dueAt: null,
    closedAt: null,
    participantId: "p1",
    assignedToId: null,
    tags: [],
    notes: [],
    tasks: [],
    ...overrides,
  };
}

describe("case-management permissions", () => {
  it("grants participant self-read", () => {
    expect(hasPermission("participant", "case:read:self")).toBe(true);
    expect(hasPermission("participant", "case:manage:any")).toBe(false);
  });
  it("grants support_coordinator manage:self and ai:run", () => {
    expect(hasPermission("support_coordinator", "case:manage:self")).toBe(true);
    expect(hasPermission("support_coordinator", "case:ai:run")).toBe(true);
  });
  it("grants admin everything", () => {
    expect(hasPermission("mapable_admin", "case:manage:any")).toBe(true);
    expect(hasPermission("mapable_admin", "case:ai:run")).toBe(true);
  });
  it("denies driver case access", () => {
    expect(hasPermission("driver", "case:manage:self")).toBe(false);
  });
});

describe("case-access scoping", () => {
  it("returns empty filter for admin", () => {
    expect(caseListWhereForUser("u", "mapable_admin")).toEqual({});
  });
  it("returns coordinator filter", () => {
    const where = caseListWhereForUser("u", "support_coordinator");
    expect(where).toHaveProperty("OR");
  });
  it("scopes participants to themselves", () => {
    expect(caseListWhereForUser("u", "participant")).toEqual({
      participantId: "u",
    });
  });
  it("canUserAccessCase respects participant", () => {
    const row = {
      participantId: "u",
      assignedToId: null,
      createdById: "x",
    };
    expect(canUserAccessCase(row, "u", "participant")).toBe(true);
    expect(canUserAccessCase(row, "v", "participant")).toBe(false);
  });
  it("canUserManageCase coordinator must own/create", () => {
    const row = {
      participantId: "u",
      assignedToId: "coord1",
      createdById: "creator",
    };
    expect(canUserManageCase(row, "coord1", "support_coordinator")).toBe(true);
    expect(canUserManageCase(row, "creator", "support_coordinator")).toBe(true);
    expect(canUserManageCase(row, "other", "support_coordinator")).toBe(false);
  });
});

describe("risk classifier", () => {
  it("flags critical-language as elevated or above", () => {
    const result = classifyRisk(
      baseSnapshot({
        description:
          "Participant disclosed self-harm ideation last night and refused food today.",
      }),
    );
    expect(["elevated", "high", "critical"]).toContain(result.level);
    expect(result.signals.length).toBeGreaterThan(0);
    expect(result.rationale).toContain("AI is advisory");
  });

  it("scores low for benign content", () => {
    const result = classifyRisk(
      baseSnapshot({
        title: "Quarterly plan review",
        description: "Update goals for the next quarter.",
      }),
    );
    expect(result.level).toBe("low");
    expect(result.score).toBeLessThan(0.2);
  });

  it("counts overdue tasks", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const result = classifyRisk(
      baseSnapshot({
        tasks: [
          {
            id: "t1",
            title: "Call provider",
            status: "pending",
            dueAt: past,
            completedAt: null,
          },
          {
            id: "t2",
            title: "Send report",
            status: "pending",
            dueAt: past,
            completedAt: null,
          },
        ],
      }),
    );
    expect(result.signals.some((s) => s.includes("overdue"))).toBe(true);
  });

  it("never auto-escalates without human review", () => {
    const result = classifyRisk(baseSnapshot());
    expect(result.rationale.toLowerCase()).toMatch(/advisory|confirm/);
  });
});

describe("summary generator", () => {
  it("returns text without hallucinating", () => {
    const snap = baseSnapshot({
      description:
        "Participant needs help finding new transport. Bus route changed and they are now isolated.",
      notes: [
        {
          id: "n1",
          body: "Spoke to participant. Confirmed they cannot reach their day program.",
          createdAt: new Date(),
          pinned: false,
        },
      ],
    });
    const summary = summarise(snap);
    expect(summary.text.length).toBeGreaterThan(0);
    expect(summary.text.toLowerCase()).toMatch(/ai|verify/);
    expect(summary.highlights.length).toBeGreaterThan(0);
    for (const h of summary.highlights) {
      expect(
        snap.description + snap.notes.map((n) => n.body).join(" "),
      ).toContain(h.replace(/[.!?]$/, ""));
    }
  });

  it("handles empty content gracefully", () => {
    const summary = summarise(baseSnapshot({ description: "" }));
    expect(summary.text.length).toBeGreaterThan(0);
    expect(summary.highlights.length).toBe(0);
  });
});

describe("next actions", () => {
  it("recommends adding an intake note when there are none", () => {
    const actions = nextActions(baseSnapshot({ description: "" }));
    expect(
      actions.find((a) => a.title.toLowerCase().includes("intake")),
    ).toBeTruthy();
  });

  it("recommends a wellbeing check for high-risk cases", () => {
    const actions = nextActions(
      baseSnapshot({ riskLevel: "high", priority: "urgent" }),
    );
    expect(
      actions.find((a) => a.title.toLowerCase().includes("wellbeing")),
    ).toBeTruthy();
  });

  it("dedupes and caps at 5", () => {
    const actions = nextActions(
      baseSnapshot({
        description: "Funding budget transport housing eviction",
        riskLevel: "critical",
      }),
    );
    expect(actions.length).toBeLessThanOrEqual(5);
    const titles = actions.map((a) => a.title.toLowerCase());
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("natural-language case search", () => {
  it("ranks matches by term frequency", () => {
    const candidates: CaseSnapshot[] = [
      baseSnapshot({
        id: "match",
        reference: "CASE-M",
        title: "Housing risk",
        description: "Participant is at risk of housing loss.",
        notes: [
          {
            id: "n",
            body: "Housing support has been contacted regarding housing.",
            createdAt: new Date(),
            pinned: false,
          },
        ],
      }),
      baseSnapshot({
        id: "other",
        reference: "CASE-O",
        category: "other",
        title: "Transport plan",
        description: "Bus pass renewed.",
      }),
    ];
    const hits = searchCases("housing risk", candidates);
    expect(hits[0]?.caseId).toBe("match");
    expect(hits.find((h) => h.caseId === "other")).toBeUndefined();
  });

  it("returns empty list for queries with only stop words", () => {
    const hits = searchCases("show me the case", [baseSnapshot()]);
    expect(hits.length).toBe(0);
  });

  it("boosts urgent or high-risk candidates on ties", () => {
    const candidates: CaseSnapshot[] = [
      baseSnapshot({
        id: "calm",
        title: "Funding review",
        description: "Funding review needed.",
      }),
      baseSnapshot({
        id: "urgent",
        title: "Funding review",
        description: "Funding review needed.",
        priority: "urgent",
        riskLevel: "high",
      }),
    ];
    const hits = searchCases("funding review", candidates);
    expect(hits[0]?.caseId).toBe("urgent");
  });
});
