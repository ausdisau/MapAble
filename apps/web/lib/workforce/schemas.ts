import { z } from "zod";

export const WorkerProfileIdSchema = z.string().min(1).max(150);

export const ReadinessEvaluateSchema = z.object({
  workerProfileId: WorkerProfileIdSchema,
  taskKey: z.string().min(1).max(80).optional(),
  participantId: z.string().min(1).max(150).optional(),
  intensity: z.enum(["standard", "high"]).optional(),
  explainWithAi: z.boolean().optional().default(false),
});

export const AssessmentRequestSchema = z.object({
  workerProfileId: WorkerProfileIdSchema,
  kind: z.enum([
    "screening_verification",
    "credential_discrepancy",
    "competency_assessment",
    "refresher",
    "revocation",
    "participant_preparation",
    "dispute",
  ]),
  evidenceIds: z.array(z.string().max(150)).max(20).default([]),
  scope: z.string().min(1).max(200),
  participantId: z.string().max(150).optional(),
});

export const AssessmentReviewSchema = z
  .object({
    caseId: z.string().min(1).max(150),
    decision: z.enum([
      "hold",
      "request_evidence",
      "refer_for_assessment",
      "escalate",
      "approve",
      "reject",
    ]),
    reason: z.string().min(1).max(500),
    limitations: z.array(z.string().max(200)).max(10).default([]),
  })
  .strict();

export const DisputeSchema = z.object({
  workerProfileId: WorkerProfileIdSchema,
  evidenceKind: z.enum(["credential", "competency", "screening", "training"]),
  evidenceId: z.string().min(1).max(150),
  reason: z.string().min(1).max(500),
});

export const SharePreferenceSchema = z.object({
  shareWithProviders: z.boolean(),
  shareWithParticipants: z.boolean(),
  shareScreeningSummary: z.boolean(),
  shareQualifications: z.boolean(),
  shareTraining: z.boolean(),
  shareCompetencies: z.boolean(),
});
