import { describe, expect, it } from "vitest";

import {
  EMPTY_CRITERIA,
  FICTIONAL_WORKERS,
  reviewFictionalWorker,
  type FictionalWorker,
  type ScreeningState,
} from "@/lib/matching/participant-preview";

const worker = FICTIONAL_WORKERS[0]!;

describe("participant matching preview (fictional, read only)", () => {
  it("never treats a fictional Clearance as actual screening evidence", () => {
    const result = reviewFictionalWorker(EMPTY_CRITERIA, worker);
    expect(result.screeningLabel).toBe("Clearance");
    expect(result.verifiedScreening).toBe(false);
    expect(result.verifiedCompetence).toBe(false);
    expect(result.confirmedAvailability).toBe(false);
    expect(result.canBook).toBe(false);
    expect(result.humanReviewRequired).toBe(true);
    expect(result.synthetic).toBe(true);
    expect(JSON.stringify(result)).not.toContain("matchScore");
  });

  it.each<ScreeningState>([
    "Interim bar",
    "Exclusion",
    "Suspension",
    "No valid clearance",
  ])("does not progress restricted fictional status %s", (status) => {
    const result = reviewFictionalWorker(EMPTY_CRITERIA, {
      ...worker,
      fictionalScreening: status,
    });
    expect(result.discussionOnly).toBe(false);
    expect(result.factors.find((factor) => factor.topic === "Worker screening")?.state)
      .toBe("blocked");
  });

  it.each<ScreeningState>([
    "Clearance", "Pending", "Not independently verified",
  ])("never upgrades the fictional label %s into verified clearance", (status) => {
    const result = reviewFictionalWorker(EMPTY_CRITERIA, {
      ...worker,
      fictionalScreening: status,
    });
    expect(result.verifiedScreening).toBe(false);
    expect(result.canBook).toBe(false);
  });

  it("respects participant do-not-consider decisions", () => {
    const result = reviewFictionalWorker({
      ...EMPTY_CRITERIA,
      excludedWorkerIds: [worker.id],
    }, worker);
    expect(result.discussionOnly).toBe(false);
    expect(result.factors.find((factor) => factor.topic === "Participant choice")?.state)
      .toBe("blocked");
  });

  it("does not assume missing AAC support is a proven inability", () => {
    const result = reviewFictionalWorker({
      ...EMPTY_CRITERIA,
      communicationNeeds: ["auslan", "aac"],
    }, worker);
    const factor = result.factors.find((item) => item.topic === "Communication access");
    expect(factor?.state).toBe("unknown");
    expect(factor?.explanation).toContain("does not prove inability");
  });

  it("does not accept self-reported support competence as verified", () => {
    const selfReport: FictionalWorker = {
      ...worker,
      competencies: [{ type: "high_intensity", evidence: "self_report" }],
    };
    const result = reviewFictionalWorker({
      ...EMPTY_CRITERIA,
      requiredCompetencies: ["high_intensity"],
    }, selfReport);
    expect(result.factors.find((item) => item.topic === "Competencies")?.state)
      .toBe("needs_confirmation");
    expect(result.verifiedCompetence).toBe(false);
  });

  it("never converts fictional schedules into confirmed availability", () => {
    const result = reviewFictionalWorker({
      ...EMPTY_CRITERIA,
      preferredWindow: "weekday_morning",
    }, worker);
    expect(result.factors.find((item) => item.topic === "Availability")?.state)
      .toBe("needs_confirmation");
    expect(result.confirmedAvailability).toBe(false);
  });

  it("only records continuity when the participant explicitly marks familiarity", () => {
    const none = reviewFictionalWorker(EMPTY_CRITERIA, worker);
    const chosen = reviewFictionalWorker({
      ...EMPTY_CRITERIA,
      familiarWorkerIds: [worker.id],
    }, worker);
    expect(none.factors.find((item) => item.topic === "Continuity")?.state)
      .toBe("not_requested");
    expect(chosen.factors.find((item) => item.topic === "Continuity")?.state)
      .toBe("fictional_only");
  });
});
