import { z } from "zod";

export const careTransportMissionInputSchema = z.object({
  goal: z.string().trim().min(3).max(500),
  appointmentQuery: z.string().trim().min(1).optional(),
  appointmentId: z.string().optional(),
  pickupLocation: z.string().trim().min(3).optional(),
  destination: z.string().trim().min(3).optional(),
  supportRequirement: z.string().trim().max(200).optional(),
  companionCount: z.number().int().min(0).max(4).default(0),
  timingToleranceMinutes: z.number().int().min(0).max(120).default(30),
  useAccessibilityProfile: z.boolean().default(false),
  consentProposalToken: z.string().min(1).optional(),
});

export type CareTransportMissionInput = z.infer<
  typeof careTransportMissionInputSchema
>;
