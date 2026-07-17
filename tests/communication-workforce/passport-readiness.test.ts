import { beforeEach, describe, expect, it, vi } from "vitest";

import { communicationPassportFromProfile } from "@/lib/communication-passport/from-profile";
import { evaluateAssignmentReadiness } from "@/lib/workforce-readiness/evaluate";

vi.mock("@/lib/config/communication-workforce", () => ({
  isCommunicationPassportEnabled: () => true,
  isWorkforceReadinessEnabled: () => true,
  communicationWorkforceConfig: {
    communicationPassportEnabled: true,
    workforceReadinessEnabled: true,
    autoAssignmentEnabled: false,
  },
}));

const hasAck = vi.fn();

vi.mock("@/lib/communication-passport/service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/communication-passport/service")>();
  return {
    ...actual,
    hasWorkerAcknowledgedPassport: (...args: unknown[]) => hasAck(...args),
  };
});

describe("Communication Passport projection", () => {
  it("projects AAC and one-question instructions without diagnosis fields", () => {
    const passport = communicationPassportFromProfile({
      userId: "participant-1",
      communicationPreferences: ["aac", "plain_language"],
      cognitivePreferences: {
        oneQuestionAtATime: true,
        extraResponseTime: true,
        communicationPassportVersion: 3,
      },
      updatedAt: new Date("2026-07-17T00:00:00.000Z"),
    });
    expect(passport.version).toBe(3);
    expect(passport.instructions.some((i) => i.mode === "aac")).toBe(true);
    expect(
      passport.instructions.some((i) => i.mode === "one_question_at_a_time"),
    ).toBe(true);
    expect(JSON.stringify(passport)).not.toMatch(/diagnos/i);
  });
});

describe("Workforce readiness (no auto-assign)", () => {
  beforeEach(() => {
    hasAck.mockReset();
  });

  it("blocks stale credentials and missing acknowledgement", async () => {
    hasAck.mockResolvedValue(false);
    const passport = communicationPassportFromProfile({
      userId: "participant-1",
      communicationPreferences: ["aac"],
      cognitivePreferences: { communicationPassportVersion: 1 },
      updatedAt: new Date(),
    });
    const result = await evaluateAssignmentReadiness({
      worker: {
        id: "wp1",
        userId: "worker-1",
        organisationId: "org-1",
        active: true,
        workerScreeningStatus: "expired",
        wwccStatus: "verified",
        firstAidStatus: "verified",
        insuranceStatus: "verified",
        verificationStatus: "verified",
      },
      organisationId: "org-1",
      passport,
      academyModuleCompletions: ["aac-101"],
      authorisedCompetencyEvidenceIds: [],
    });
    expect(result.ready).toBe(false);
    expect(result.autoAssignment).toBe(false);
    expect(result.reasons.some((r) => r.code === "screening_not_clear")).toBe(
      true,
    );
    expect(
      result.reasons.some((r) => r.code === "communication_not_acknowledged"),
    ).toBe(true);
    expect(
      result.reasons.some((r) => r.code === "academy_completion_not_competency"),
    ).toBe(true);
    expect(
      result.reasons.some((r) => r.code === "aac_competency_unverified"),
    ).toBe(true);
  });

  it("is ready only when credentials, ack, and competency evidence present", async () => {
    hasAck.mockResolvedValue(true);
    const passport = communicationPassportFromProfile({
      userId: "participant-1",
      communicationPreferences: ["plain_language"],
      cognitivePreferences: { communicationPassportVersion: 2 },
      updatedAt: new Date(),
    });
    const result = await evaluateAssignmentReadiness({
      worker: {
        id: "wp1",
        userId: "worker-1",
        organisationId: "org-1",
        active: true,
        workerScreeningStatus: "verified",
        wwccStatus: "verified",
        firstAidStatus: "verified",
        insuranceStatus: "verified",
        verificationStatus: "verified",
      },
      organisationId: "org-1",
      passport,
      authorisedCompetencyEvidenceIds: [],
    });
    expect(result.ready).toBe(true);
    expect(result.autoAssignment).toBe(false);
    expect(result.reasons.some((r) => r.code === "ready")).toBe(true);
  });
});
