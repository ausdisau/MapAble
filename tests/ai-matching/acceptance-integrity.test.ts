import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniqueMock,
  updateManyMock,
  findUniqueOrThrowMock,
  careRequestFindMock,
  fairnessReviewFindMock,
  transactionMock,
  auditMock,
  matchFindManyMock,
  aiRunCreateMock,
  aiCandidateCreateMock,
  explanationCreateManyMock,
  matchingModelFindMock,
  fairnessCheckMock,
  careMatchMock,
} = vi.hoisted(() => ({
  findUniqueMock: vi.fn(),
  updateManyMock: vi.fn(),
  findUniqueOrThrowMock: vi.fn(),
  careRequestFindMock: vi.fn(),
  fairnessReviewFindMock: vi.fn(),
  transactionMock: vi.fn(),
  auditMock: vi.fn(),
  matchFindManyMock: vi.fn(),
  aiRunCreateMock: vi.fn(),
  aiCandidateCreateMock: vi.fn(),
  explanationCreateManyMock: vi.fn(),
  matchingModelFindMock: vi.fn(),
  fairnessCheckMock: vi.fn(),
  careMatchMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: transactionMock,
    aiMatchCandidate: {
      findUnique: findUniqueMock,
      updateMany: updateManyMock,
      findUniqueOrThrow: findUniqueOrThrowMock,
      create: aiCandidateCreateMock,
      update: vi.fn(),
    },
    aiMatchRun: {
      create: aiRunCreateMock,
      update: vi.fn(),
    },
    aiMatchExplanation: {
      createMany: explanationCreateManyMock,
    },
    matchCandidate: {
      findMany: matchFindManyMock,
    },
    matchingModelVersion: {
      findFirst: matchingModelFindMock,
    },
    careRequest: {
      findUnique: careRequestFindMock,
    },
    fairnessReview: {
      findFirst: fairnessReviewFindMock,
    },
  },
}));

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: auditMock,
}));

vi.mock("@/lib/matching/matching-service", () => ({
  runCareWorkerMatch: careMatchMock,
}));

vi.mock("@/lib/fairness/fairness-check-service", () => ({
  runFairnessCheck: fairnessCheckMock,
}));

vi.mock("@/lib/config/phase5", () => ({
  phase5Config: {
    aiMatchingEnabled: true,
    aiMatchingProvider: "disabled",
    aiMatchingRequireHumanReview: true,
    fairnessChecksEnabled: true,
  },
}));

import {
  acceptAiCandidate,
  buildParticipantExplanation,
  buildScoreBreakdown,
  runAiCareMatch,
} from "@/lib/ai-matching/ai-match-service";
import { AiMatchingError } from "@/lib/ai-matching/types";

function baseCandidate(overrides: Record<string, unknown> = {}) {
  return {
    id: "aic-1",
    status: "generated",
    expiresAt: new Date(Date.now() + 60_000),
    matchCandidateId: "mc-1",
    aiMatchRunId: "air-1",
    modelRunId: null,
    aiMatchRun: {
      id: "air-1",
      careRequestId: "cr-1",
    },
    matchCandidate: {
      id: "mc-1",
      matchRun: { careRequestId: "cr-1" },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  auditMock.mockResolvedValue(undefined);
  transactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      aiMatchCandidate: {
        findUnique: findUniqueMock,
        updateMany: updateManyMock,
        findUniqueOrThrow: findUniqueOrThrowMock,
      },
      aiMatchRun: {
        update: vi.fn().mockResolvedValue({}),
      },
      careRequest: {
        findUnique: careRequestFindMock,
      },
      fairnessReview: {
        findFirst: fairnessReviewFindMock,
      },
    };
    return fn(tx);
  });
  careRequestFindMock.mockResolvedValue({
    id: "cr-1",
    participantId: "p-1",
    assignedOrganisationId: "org-1",
  });
  fairnessReviewFindMock.mockResolvedValue({
    id: "fr-1",
    decision: "approved",
  });
  updateManyMock.mockResolvedValue({ count: 1 });
  findUniqueOrThrowMock.mockResolvedValue(baseCandidate({ status: "accepted" }));
});

describe("buildScoreBreakdown honesty", () => {
  it("keeps model fields null when no model ran", () => {
    const b = buildScoreBreakdown({ ruleScore: 0.8 });
    expect(b.modelCommentaryScore).toBeNull();
    expect(b.modelRunId).toBeNull();
    expect(b.modelVersion).toBeNull();
    expect(b.deterministicRuleScore).toBe(0.8);
    expect(b.combinedDisplayScore).toBe(0.8);
  });

  it("does not remix rule score into a fake model score", () => {
    const b = buildScoreBreakdown({ ruleScore: 0.9 });
    expect(b.modelCommentaryScore).not.toBeCloseTo(0.9 * 0.15 + 0.05);
    expect(b.modelCommentaryScore).toBeNull();
  });

  it("never lets model commentary override hard requirements", () => {
    const b = buildScoreBreakdown({
      ruleScore: 0.95,
      hardRequirementsMet: false,
      modelCommentaryScore: 0.99,
      modelRunId: "run-1",
      modelVersion: "v1",
    });
    expect(b.hardRequirementsMet).toBe(false);
    expect(b.lowConfidence).toBe(true);
  });
});

describe("participant explanation", () => {
  it("surfaces confirmed, unknown, and who must confirm", () => {
    const b = buildScoreBreakdown({
      ruleScore: 0.7,
      unknownFields: ["Availability for the requested time window."],
    });
    const e = buildParticipantExplanation(b, "Skills and access notes align.");
    expect(e.whyMayWork).toContain("Skills");
    expect(e.confirmed.length).toBeGreaterThan(0);
    expect(e.unknown.length).toBeGreaterThan(0);
    expect(e.whoMustConfirm.toLowerCase()).toContain("confirm");
    expect(e.modelRan).toBe(false);
  });
});

describe("acceptAiCandidate integrity", () => {
  it("rejects missing fairness review without mutating", async () => {
    findUniqueMock.mockResolvedValue(baseCandidate());
    fairnessReviewFindMock.mockResolvedValue(null);
    await expect(acceptAiCandidate("aic-1", "actor-1")).rejects.toMatchObject({
      code: "FAIRNESS_REVIEW_MISSING",
    });
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("rejects fairness review that is not explicitly approved", async () => {
    findUniqueMock.mockResolvedValue(baseCandidate());
    fairnessReviewFindMock.mockResolvedValue({ decision: "noted" });
    await expect(acceptAiCandidate("aic-1", "actor-1")).rejects.toBeInstanceOf(
      AiMatchingError
    );
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("rejects rejected fairness review", async () => {
    findUniqueMock.mockResolvedValue(baseCandidate());
    fairnessReviewFindMock.mockResolvedValue({ decision: "rejected" });
    await expect(acceptAiCandidate("aic-1", "actor-1")).rejects.toMatchObject({
      code: "FAIRNESS_REVIEW_REJECTED",
    });
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("rejects expired candidates", async () => {
    findUniqueMock.mockResolvedValue(
      baseCandidate({ expiresAt: new Date(Date.now() - 1000) })
    );
    await expect(acceptAiCandidate("aic-1", "actor-1")).rejects.toMatchObject({
      code: "EXPIRED",
    });
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("rejects candidate from another care request", async () => {
    findUniqueMock.mockResolvedValue(baseCandidate());
    await expect(
      acceptAiCandidate("aic-1", "actor-1", { expectedCareRequestId: "cr-other" })
    ).rejects.toMatchObject({ code: "CARE_REQUEST_MISMATCH" });
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("rejects cross-tenant organisation scope", async () => {
    findUniqueMock.mockResolvedValue(baseCandidate());
    await expect(
      acceptAiCandidate("aic-1", "actor-1", { actorOrganisationId: "org-other" })
    ).rejects.toMatchObject({ code: "CROSS_TENANT" });
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("rejects candidate ownership mismatch across care requests", async () => {
    findUniqueMock.mockResolvedValue(
      baseCandidate({
        matchCandidate: {
          id: "mc-1",
          matchRun: { careRequestId: "cr-other" },
        },
      })
    );
    await expect(acceptAiCandidate("aic-1", "actor-1")).rejects.toMatchObject({
      code: "CANDIDATE_OWNERSHIP_MISMATCH",
    });
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it("rejects concurrent acceptance when updateMany counts zero", async () => {
    findUniqueMock.mockResolvedValue(baseCandidate());
    updateManyMock.mockResolvedValue({ count: 0 });
    await expect(acceptAiCandidate("aic-1", "actor-1")).rejects.toMatchObject({
      code: "CONCURRENT_ACCEPTANCE",
    });
  });

  it("accepts when fairness approved and scopes match", async () => {
    findUniqueMock.mockResolvedValue(baseCandidate());
    const accepted = await acceptAiCandidate("aic-1", "actor-1", {
      actorOrganisationId: "org-1",
      expectedCareRequestId: "cr-1",
    });
    expect(updateManyMock).toHaveBeenCalled();
    expect(accepted.status).toBe("accepted");
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ai_match.candidate_accepted" })
    );
  });
});

describe("runAiCareMatch deterministic-only", () => {
  it("creates candidates with null model commentary when provider disabled", async () => {
    careMatchMock.mockResolvedValue({
      run: { id: "mr-1" },
    });
    matchingModelFindMock.mockResolvedValue(null);
    aiRunCreateMock.mockResolvedValue({ id: "air-1" });
    matchFindManyMock.mockResolvedValue([
      {
        id: "mc-1",
        score: 0.82,
        scoreExplanation: "Access and skills align.",
        candidateWorkerId: "w-1",
        candidateUserId: "u-1",
      },
    ]);
    aiCandidateCreateMock.mockResolvedValue({ id: "aic-1" });
    explanationCreateManyMock.mockResolvedValue({ count: 2 });
    fairnessCheckMock.mockResolvedValue({ id: "fc-1" });

    const result = await runAiCareMatch("cr-1", "actor-1");
    expect(result).toMatchObject({ deterministicOnly: true });
    expect(aiCandidateCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modelCommentaryScore: null,
          modelRunId: null,
          modelVersionLabel: null,
          ruleScore: 0.82,
        }),
      })
    );
    expect(auditMock).toHaveBeenCalledWith(
      expect.objectContaining({ action: "ai_match.model_unavailable" })
    );
  });
});
