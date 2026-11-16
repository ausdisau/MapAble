import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  workerFindUnique,
  enrollmentFindFirst,
  evidenceCreate,
  proposalCreate,
  proposalFindUnique,
  proposalUpdate,
  evidenceUpdate,
  completionFindUnique,
  orgMemberFindFirst,
  screeningFindMany,
  transaction,
} = vi.hoisted(() => ({
  workerFindUnique: vi.fn(),
  enrollmentFindFirst: vi.fn(),
  evidenceCreate: vi.fn(),
  proposalCreate: vi.fn(),
  proposalFindUnique: vi.fn(),
  proposalUpdate: vi.fn(),
  evidenceUpdate: vi.fn(),
  completionFindUnique: vi.fn(),
  orgMemberFindFirst: vi.fn(),
  screeningFindMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workerProfile: { findUnique: workerFindUnique },
    providerAcademyEnrollment: { findFirst: enrollmentFindFirst },
    workerCompetencyEvidence: { create: evidenceCreate, update: evidenceUpdate },
    academyCompetencyProposal: {
      create: proposalCreate,
      findUnique: proposalFindUnique,
      update: proposalUpdate,
    },
    workerTrainingCompletion: { findUnique: completionFindUnique },
    organisationMember: { findFirst: orgMemberFindFirst },
    workerScreeningRecord: { findMany: screeningFindMany },
    $transaction: transaction,
  },
}));

import {
  proposeCompetencyFromAcademy,
  proposeCompetencyFromTrainingCompletion,
  verifyCompetencyProposal,
} from "@/lib/careos/opportunities/workforce-passport-adapter";
import { isCapabilityPassportPreviewEnabled } from "@/lib/config/capability-passport";
import { MockIssuerAdapter, mapClaimsToWorkerStatuses } from "@/lib/trust/passport/issuer-adapter";
import { AI_EXPLAIN_WRITE_PERMISSION, structuredSkillsGapExplanation } from "@/lib/workforce/ai-explain";
import { selectBestEvidenceForType } from "@/lib/workforce/evidence-selection";
import { learningAvailableWithoutAi, recommendLearning } from "@/lib/workforce/learning-catalog";
import { evaluatePlatform0137Rules } from "@/lib/workforce/platform-0137-rules";
import { resolveScreeningGateway } from "@/lib/workforce/screening-gateway";
import {
  defaultRoleRequirements,
  evaluateSkillsGap,
  type SkillsGapItem,
} from "@/lib/workforce/skills-gap";
import { evaluateTaskReadiness, toParticipantLimitedReasons } from "@/lib/workforce/task-readiness";
import { evaluateWorkforceEvidence } from "@mapable/domain-workforce";

const now = new Date("2026-11-17T00:00:00.000Z");

function gap(overrides: Partial<SkillsGapItem> & Pick<SkillsGapItem, "requirementKey" | "label" | "state">): SkillsGapItem {
  return {
    reasonCodes: [],
    sourceRefs: [],
    nextAction: "next",
    copy: "copy",
    ...overrides,
  };
}

describe("Capability Passport v1 engines", () => {
  beforeEach(() => {
    process.env.MAPABLE_CAREOS_WORKFORCE_PASSPORT_ENABLED = "true";
    process.env.MAPABLE_CAPABILITY_PASSPORT_V1_ENABLED = "true";
    delete process.env.VERCEL_ENV;
    transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) =>
      fn({
        academyCompetencyProposal: {
          findUnique: proposalFindUnique,
          update: proposalUpdate,
        },
        workerProfile: { findUnique: workerFindUnique },
        workerScreeningRecord: { findMany: screeningFindMany },
        workerCompetencyEvidence: { update: evidenceUpdate },
      }),
    );
  });

  it("1. course completion is not verified competency", () => {
    const result = evaluateSkillsGap({
      now,
      requirements: defaultRoleRequirements().filter((row) => row.key === "safeguarding"),
      credentials: [],
      competencies: [],
      training: [{ moduleOrCourse: "SAFEGUARDING-101", status: "completed", identityLinked: true }],
      screening: [],
    });
    expect(result.items[0]?.state).toBe("assessment_required");
    expect(result.items[0]?.reasonCodes).toContain("COURSE_COMPLETION_IS_NOT_COMPETENCY");
    expect(result.items[0]?.copy).toMatch(/Practical competence not yet assessed/i);
  });

  it("2. enrolled is not completed", async () => {
    workerFindUnique.mockResolvedValue({
      id: "wp1",
      userId: "user-1",
      organisationId: "org-1",
    });
    enrollmentFindFirst.mockResolvedValue({
      id: "en1",
      courseId: "c1",
      userId: "user-1",
      status: "enrolled",
      completedAt: null,
      course: { code: "SAFEGUARDING-101" },
    });
    await expect(
      proposeCompetencyFromAcademy({
        workerProfileId: "wp1",
        courseId: "c1",
        competencyType: "safeguarding",
        proposedByUserId: "user-1",
      }),
    ).rejects.toThrow("ENROLLED_NOT_COMPLETED");
  });

  it("3. mock issuer claims are not clearance", async () => {
    const presentation = await new MockIssuerAdapter().issuePresentation({
      workerProfileId: "wp1",
      credentialType: "worker_screening_bundle",
    });
    expect(presentation.claims.workerScreeningStatus).toBe("mock_unverified");
    expect(mapClaimsToWorkerStatuses(presentation.claims)).toEqual({});
    const screening = resolveScreeningGateway([]);
    expect(screening.displayStatus).toMatch(/NOT INDEPENDENTLY VERIFIED/);
    expect(screening.independentlyVerified).toBe(false);
  });

  it("4-6. expired, revoked and missing evidence stay blocked", () => {
    const expired = evaluateWorkforceEvidence({
      now,
      requiredCredentialTypes: ["wwcc"],
      evidence: [
        {
          credentialType: "wwcc",
          verificationStatus: "verified",
          expiresAt: "2026-01-01T00:00:00.000Z",
          revokedAt: null,
        },
      ],
    });
    const revoked = evaluateWorkforceEvidence({
      now,
      requiredCredentialTypes: ["wwcc"],
      evidence: [
        {
          credentialType: "wwcc",
          verificationStatus: "verified",
          expiresAt: "2027-01-01T00:00:00.000Z",
          revokedAt: "2026-02-01T00:00:00.000Z",
        },
      ],
    });
    const missing = evaluateWorkforceEvidence({
      now,
      requiredCredentialTypes: ["wwcc"],
      evidence: [],
    });
    expect(expired.reasonCodes[0]).toMatch(/EXPIRED_OR_REVOKED/);
    expect(revoked.reasonCodes[0]).toMatch(/EXPIRED_OR_REVOKED/);
    expect(missing.reasonCodes[0]).toMatch(/MISSING/);
  });

  it("10. stale revoked competency is not used when a later valid record exists", () => {
    const selected = selectBestEvidenceForType(
      [
        {
          credentialType: "safeguarding",
          verificationStatus: "revoked",
          expiresAt: null,
          revokedAt: "2026-01-01T00:00:00.000Z",
        },
        {
          credentialType: "safeguarding",
          verificationStatus: "verified",
          expiresAt: "2027-01-01T00:00:00.000Z",
          revokedAt: null,
        },
      ],
      "safeguarding",
      now,
    );
    expect(selected?.verificationStatus).toBe("verified");
  });

  it("9. refuses self-approval of a competency proposal", async () => {
    proposalFindUnique.mockResolvedValue({
      id: "pr1",
      status: "pending",
      workerProfileId: "wp1",
      evidenceId: "ev1",
    });
    workerFindUnique.mockResolvedValue({
      id: "wp1",
      userId: "same-human",
      organisationId: "org-1",
    });
    screeningFindMany.mockResolvedValue([]);
    await expect(
      verifyCompetencyProposal({
        proposalId: "pr1",
        verifiedByUserId: "same-human",
        approve: true,
      }),
    ).rejects.toThrow("SELF_APPROVAL_FORBIDDEN");
  });

  it("cannot override Exclusion with approve", async () => {
    proposalFindUnique.mockResolvedValue({
      id: "pr1",
      status: "pending",
      workerProfileId: "wp1",
      evidenceId: "ev1",
    });
    workerFindUnique.mockResolvedValue({
      id: "wp1",
      userId: "worker-1",
      organisationId: "org-1",
    });
    screeningFindMany.mockResolvedValue([
      {
        officialOutcome: "exclusion",
        expiresAt: null,
        eligibleToWork: false,
        identityLinked: true,
        source: "official-fixture",
        reviewedAt: now,
      },
    ]);
    await expect(
      verifyCompetencyProposal({
        proposalId: "pr1",
        verifiedByUserId: "assessor-1",
        approve: true,
      }),
    ).rejects.toThrow("LEGAL_PROHIBITION_NOT_OVERRIDABLE");
  });

  it("training completion identity must match the worker", async () => {
    workerFindUnique.mockResolvedValue({
      id: "wp1",
      userId: "user-1",
      organisationId: "org-1",
    });
    completionFindUnique.mockResolvedValue({
      id: "tc1",
      userId: "someone-else",
      completedAt: now,
      expiresAt: null,
    });
    await expect(
      proposeCompetencyFromTrainingCompletion({
        workerProfileId: "wp1",
        trainingCompletionId: "tc1",
        competencyType: "safeguarding",
        proposedByUserId: "user-1",
      }),
    ).rejects.toThrow("IDENTITY_MISMATCH");
  });

  it("12. AI explain has no write permission", () => {
    expect(AI_EXPLAIN_WRITE_PERMISSION).toBe(false);
    const text = structuredSkillsGapExplanation([
      gap({
        requirementKey: "safeguarding",
        label: "Safeguarding",
        state: "assessment_required",
        copy: "Training completed. Practical competence not yet assessed.",
      }),
    ]);
    expect(text.labelledAi).toBe(false);
    expect(text.source).toBe("structured");
  });

  it("14. learning catalog works with AI off", () => {
    const items = learningAvailableWithoutAi();
    expect(items.some((row) => row.code === "SAFEGUARDING-101")).toBe(true);
    expect(items.some((row) => row.code === "ACCESSIBILITY-101")).toBe(true);
    const recommended = recommendLearning([
      gap({
        requirementKey: "safeguarding",
        label: "Safeguarding",
        state: "training_recommended",
      }),
    ]);
    expect(recommended.length).toBeGreaterThan(0);
  });

  it("high-intensity stays human_review_required", () => {
    const result = evaluateSkillsGap({
      now,
      requirements: [
        {
          key: "high_intensity",
          label: "High intensity support",
          kind: "high_intensity",
          required: true,
        },
      ],
      credentials: [],
      competencies: [],
      training: [{ moduleOrCourse: "SAFEGUARDING-101", status: "completed", identityLinked: true }],
      screening: [],
    });
    expect(result.items[0]?.state).toBe("human_review_required");
  });

  it("0137 rule pack stays default-off and does not apply clearance-before-offer", () => {
    delete process.env.MAPABLE_CAREOS_PLATFORM_REGISTRATION_ENABLED;
    expect(evaluatePlatform0137Rules().applied).toBe(false);
    process.env.MAPABLE_CAREOS_PLATFORM_REGISTRATION_ENABLED = "true";
    const evaluated = evaluatePlatform0137Rules({
      connectingNdisPlanSupports: true,
      processingNdisPayments: true,
    });
    expect(evaluated.clearanceBeforeOffer).toBe(false);
    expect(evaluated.counselPending).toBe(true);
  });

  it("task readiness keeps learning available when a task is not ready", () => {
    const result = evaluateTaskReadiness({
      now,
      workerActive: true,
      organisationMatch: true,
      credentials: [],
      requiredCredentialTypes: ["wwcc"],
      screening: [],
      requirements: defaultRoleRequirements(),
      competencies: [],
      training: [],
      participantBlocked: false,
      communicationAccessOk: false,
      limitations: ["participant orientation outstanding"],
    });
    expect(result.ready).toBe(false);
    expect(result.learningStillAvailable).toBe(true);
    expect(toParticipantLimitedReasons(result).join(" ")).not.toMatch(/screening number|clinical/i);
  });

  it("production hard-deny even if the env flag is true", () => {
    process.env.MAPABLE_CAPABILITY_PASSPORT_V1_ENABLED = "true";
    process.env.VERCEL_ENV = "production";
    expect(isCapabilityPassportPreviewEnabled()).toBe(false);
  });
});
