import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  CAPABILITY_PASSPORT_POLICY_VERSION,
  DEFAULT_SCREENING_DISPLAY,
} from "@/lib/config/capability-passport";
import { prisma } from "@/lib/prisma";
import { explainSkillsGaps } from "@/lib/workforce/ai-explain";
import { sanitiseAuditMetadata } from "@/lib/workforce/http";
import { learningAvailableWithoutAi, recommendLearning } from "@/lib/workforce/learning-catalog";
import { resolveScreeningGateway } from "@/lib/workforce/screening-gateway";
import {
  defaultRoleRequirements,
  evaluateSkillsGap,
  type SkillsGapRequirement,
} from "@/lib/workforce/skills-gap";
import {
  evaluateTaskReadiness,
  toParticipantLimitedReasons,
} from "@/lib/workforce/task-readiness";

function toEvidence(record: {
  credentialType?: string;
  competencyType?: string;
  verificationStatus: string;
  expiresAt: Date | null;
  revokedAt?: Date | null;
}) {
  const status =
    record.verificationStatus === "verified" ||
    record.verificationStatus === "pending_review" ||
    record.verificationStatus === "expired" ||
    record.verificationStatus === "revoked"
      ? record.verificationStatus
      : "unverified";
  return {
    credentialType: record.credentialType ?? record.competencyType ?? "unknown",
    verificationStatus: status as
      | "verified"
      | "pending_review"
      | "unverified"
      | "revoked"
      | "expired",
    expiresAt: record.expiresAt?.toISOString() ?? null,
    revokedAt: record.revokedAt?.toISOString() ?? null,
  };
}

export async function buildWorkerPassport(input: {
  workerProfileId: string;
  actorUserId: string;
  actorRole?: string | null;
  participantId?: string | null;
}) {
  const worker = await prisma.workerProfile.findUnique({
    where: { id: input.workerProfileId },
    include: {
      credentialEvidence: true,
      competencyEvidence: true,
      screeningRecords: true,
      evidenceDisputes: { where: { status: "open" } },
      passportSharePreference: true,
      organisation: { select: { name: true } },
    },
  });
  if (!worker) throw new Error("WORKER_NOT_FOUND");

  const [enrollments, completions] = await Promise.all([
    worker.userId
      ? prisma.providerAcademyEnrollment.findMany({
          where: { userId: worker.userId },
          include: { course: true },
        })
      : Promise.resolve([]),
    worker.userId
      ? prisma.workerTrainingCompletion.findMany({
          where: { userId: worker.userId },
          include: { module: true },
        })
      : Promise.resolve([]),
  ]);

  const training = [
    ...enrollments.map((row) => ({
      moduleOrCourse: row.course.code,
      status: (row.status === "completed" && row.completedAt ? "completed" : "enrolled") as
        | "enrolled"
        | "completed",
      identityLinked: Boolean(worker.userId && row.userId === worker.userId),
    })),
    ...completions.map((row) => ({
      moduleOrCourse: row.module.title,
      status: "completed" as const,
      identityLinked: Boolean(worker.userId && row.userId === worker.userId),
    })),
  ];

  const screening = resolveScreeningGateway(worker.screeningRecords);
  const requirements = defaultRoleRequirements();
  const gaps = evaluateSkillsGap({
    requirements,
    credentials: worker.credentialEvidence.map((row) =>
      toEvidence({ ...row, credentialType: row.credentialType }),
    ),
    competencies: worker.competencyEvidence.map((row) => ({
      ...toEvidence({ ...row, competencyType: row.competencyType }),
      competencyType: row.competencyType,
      source: row.source,
    })),
    training,
    screening: worker.screeningRecords,
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as never,
    action: "capability_passport.accessed",
    entityType: "WorkerProfile",
    entityId: worker.id,
    organisationId: worker.organisationId,
    participantId: input.participantId ?? null,
    metadata: sanitiseAuditMetadata({
      purpose: "capability_passport_v1",
      sections: ["screening", "qualifications", "training", "competencies"],
    }),
  });

  return {
    policyVersion: CAPABILITY_PASSPORT_POLICY_VERSION,
    workerProfileId: worker.id,
    displayName: worker.displayName,
    organisationName: worker.organisation.name,
    screening: {
      ...screening,
      displayStatus: screening.displayStatus || DEFAULT_SCREENING_DISPLAY,
      eligibleToWork: screening.eligibleToWork,
    },
    credentials: worker.credentialEvidence.map((row) => ({
      id: row.id,
      type: row.credentialType,
      source: row.source,
      issuer: row.issuer,
      identityLinked: Boolean(row.identifierMasked),
      verificationState: row.verificationStatus,
      effectiveAt: row.issuedAt,
      expiresAt: row.expiresAt,
      restrictions: row.revokedAt ? ["revoked"] : [],
      nextAction: row.verificationStatus === "verified" ? "Monitor expiry" : "Seek verification",
      lastReviewed: row.updatedAt,
    })),
    competencies: worker.competencyEvidence.map((row) => ({
      id: row.id,
      type: row.competencyType,
      source: row.source,
      identityLinked: Boolean(worker.userId),
      verificationState: row.verificationStatus,
      effectiveAt: row.effectiveAt,
      expiresAt: row.expiresAt,
      assessorRole: row.verifiedByUserId ? "human_assessor" : "unassigned",
      restrictions: row.limitations,
      nextAction:
        row.verificationStatus === "verified"
          ? "Keep current"
          : "Training completed. Practical competence not yet assessed.",
      lastReviewed: row.createdAt,
    })),
    training,
    disputes: worker.evidenceDisputes,
    sharePreference: worker.passportSharePreference,
    gaps: gaps.items,
    noTrustScore: true,
  };
}

export async function evaluatePassportReadiness(input: {
  workerProfileId: string;
  actorUserId: string;
  actorRole?: string | null;
  participantId?: string;
  intensity?: "standard" | "high";
  explainWithAi?: boolean;
}) {
  const worker = await prisma.workerProfile.findUnique({
    where: { id: input.workerProfileId },
    include: {
      credentialEvidence: true,
      competencyEvidence: true,
      screeningRecords: true,
    },
  });
  if (!worker) throw new Error("WORKER_NOT_FOUND");

  let participantBlocked = false;
  if (input.participantId) {
    const rights = await prisma.careParticipantPreference.findMany({
      where: { participantId: input.participantId, preferenceKey: "blocked_worker_ids" },
    });
    participantBlocked = rights.some((row) => {
      const value = row.value;
      return Array.isArray(value) && value.includes(worker.id);
    });
  }

  const requirements: SkillsGapRequirement[] = defaultRoleRequirements().map((row) =>
    row.key === "high_intensity"
      ? { ...row, required: input.intensity === "high" }
      : row,
  );

  const training = worker.userId
    ? (
        await prisma.providerAcademyEnrollment.findMany({
          where: { userId: worker.userId },
          include: { course: true },
        })
      ).map((row) => ({
        moduleOrCourse: row.course.code,
        status: (row.status === "completed" && row.completedAt ? "completed" : "enrolled") as
          | "enrolled"
          | "completed",
        identityLinked: row.userId === worker.userId,
      }))
    : [];

  const readiness = evaluateTaskReadiness({
    workerActive: worker.active,
    organisationMatch: true,
    credentials: worker.credentialEvidence.map((row) =>
      toEvidence({ ...row, credentialType: row.credentialType }),
    ),
    requiredCredentialTypes: worker.credentialEvidence.length
      ? [...new Set(worker.credentialEvidence.map((row) => row.credentialType))]
      : ["wwcc"],
    screening: worker.screeningRecords,
    requirements,
    competencies: worker.competencyEvidence.map((row) => ({
      ...toEvidence({ ...row, competencyType: row.competencyType }),
      competencyType: row.competencyType,
      source: row.source,
    })),
    training,
    participantBlocked,
    communicationAccessOk: true,
    limitations: worker.competencyEvidence.flatMap((row) => row.limitations),
  });

  const explanation = await explainSkillsGaps({
    gaps: readiness.gaps,
    aiRequested: Boolean(input.explainWithAi),
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole as never,
    action: "capability_passport.readiness_evaluated",
    entityType: "WorkerProfile",
    entityId: worker.id,
    organisationId: worker.organisationId,
    participantId: input.participantId ?? null,
    metadata: sanitiseAuditMetadata({
      ready: readiness.ready,
      ai: explanation.source,
    }),
  });

  return {
    ready: readiness.ready,
    learningStillAvailable: readiness.learningStillAvailable,
    reasons: readiness.reasons,
    gaps: readiness.gaps,
    explanation,
    participantLimitedReasons: toParticipantLimitedReasons(readiness),
    autoAssign: false,
    booking: false,
  };
}

export function listLearningRecommendations(gaps: Parameters<typeof recommendLearning>[0]) {
  const recommended = recommendLearning(gaps);
  return {
    aiRequired: false,
    items: recommended.length > 0 ? recommended : learningAvailableWithoutAi(),
  };
}

export async function listDefaultRequirements() {
  return {
    policyVersion: CAPABILITY_PASSPORT_POLICY_VERSION,
    requirements: defaultRoleRequirements(),
    screeningDefault: DEFAULT_SCREENING_DISPLAY,
  };
}
