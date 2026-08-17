import { z } from "zod";

export const employmentTypeSchema = z.enum([
  "full_time",
  "part_time",
  "casual",
  "contract",
  "volunteer",
  "work_experience",
  "supported_employment",
]);

export const createJobSchema = z.object({
  employerOrganisationId: z.string(),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  employmentType: employmentTypeSchema,
  location: z.string().optional(),
  remoteAllowed: z.boolean().optional(),
  flexibleHours: z.boolean().optional(),
  payRange: z.string().optional(),
  accessibilityFeatures: z.record(z.string(), z.unknown()).optional(),
  adjustmentOpennessStatement: z.string().optional(),
  applicationInstructions: z.string().optional(),
});

export const createJobApplicationSchema = z.object({
  jobId: z.string(),
  applicantSummary: z.string().optional(),
  coverLetter: z.string().optional(),
  reasonableAdjustmentRequest: z.string().optional(),
  shareAdjustments: z.boolean().optional(),
  shareAdjustmentsConfirmed: z.boolean().optional(),
  transportSupportNeeded: z.boolean().optional(),
  careSupportNeeded: z.boolean().optional(),
  resumeDocumentId: z.string().optional(),
});
