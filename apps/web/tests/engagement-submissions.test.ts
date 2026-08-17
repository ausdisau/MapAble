import { describe, expect, it } from "vitest";

import { consentScopeFromPrisma, consentScopeToPrisma } from "@/lib/consent/scope-map";
import { addBusinessDays, acknowledgementDueAt } from "@/lib/engagement/acknowledgement-sla";
import {
  buildCommissionHandoffUrl,
  buildCommissionLodgingPackage,
} from "@/lib/engagement/ndis-commission-client";
import { calculateNpsFromScores } from "@/lib/engagement/nps-test-utils";
import { scoreQuiz } from "@/lib/engagement/worker-training-service";

describe("engagement acknowledgement SLA", () => {
  it("adds business days skipping weekends", () => {
    const monday = new Date("2026-06-01T10:00:00");
    const due = addBusinessDays(monday, 2);
    expect(due.getDay()).toBe(3);
    expect(due.getDate()).toBe(3);
  });

  it("computes acknowledgement due date", () => {
    const received = new Date("2026-06-01T09:00:00");
    const due = acknowledgementDueAt(received);
    expect(due.getTime()).toBeGreaterThan(received.getTime());
  });
});

describe("engagement consent scopes", () => {
  it("maps engagement delegate scopes", () => {
    expect(consentScopeToPrisma("engagement.read_delegate")).toBe(
      "engagement_read_delegate"
    );
    expect(consentScopeFromPrisma("engagement_submit_delegate")).toBe(
      "engagement.submit_delegate"
    );
  });
});

describe("NPS calculation", () => {
  it("suppresses small cohorts", () => {
    const result = calculateNpsFromScores([10, 9, 6], 5);
    expect(result.suppressed).toBe(true);
    expect(result.nps).toBeNull();
  });

  it("calculates NPS for adequate cohort", () => {
    const result = calculateNpsFromScores(
      [10, 9, 9, 8, 7, 6, 4, 3, 2, 1],
      5
    );
    expect(result.suppressed).toBe(false);
    expect(result.nps).toBe(-20);
  });
});

describe("Commission lodging package", () => {
  it("builds handoff URL with submission reference", () => {
    const pkg = buildCommissionLodgingPackage({
      id: "sub_abc123",
      title: "Test",
      body: "Details",
      advocateInvolved: false,
      complaintId: "cmp_1",
      participant: { name: "Alex", email: "alex@example.com" },
      organisation: { name: "Provider Co" },
    });
    expect(pkg.mapableSubmissionId).toBe("sub_abc123");
    const url = buildCommissionHandoffUrl(pkg);
    expect(url).toContain("ndiscommission.gov.au");
    expect(url).toContain("sub_abc123");
  });
});

describe("worker training quiz", () => {
  it("scores quiz answers", () => {
    const questions = [
      { correctIndex: 1 },
      { correctIndex: 0 },
      { correctIndex: 2 },
    ];
    expect(scoreQuiz(questions, [1, 0, 2])).toBe(100);
    expect(scoreQuiz(questions, [0, 0, 2])).toBe(67);
  });
});
