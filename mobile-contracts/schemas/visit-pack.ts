import { z } from "zod";

export const visitPackInstructionSchema = z
  .object({
    id: z.string(),
    mode: z.string(),
    workerFacingWording: z.string(),
    required: z.boolean(),
  })
  .strict();

export const visitPackSchema = z
  .object({
    packId: z.string(),
    participantId: z.string(),
    passportVersion: z.number().int().positive(),
    compiledAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
    careSummary: z.string().max(2000).optional(),
    transportSummary: z.string().max(2000).optional(),
    venueSummary: z.string().max(2000).optional(),
    instructions: z.array(visitPackInstructionSchema).max(50),
    /** Never include diagnosis or full address unless purpose-bound. */
    redacted: z.literal(true),
    offlineBounded: z.literal(true),
  })
  .strict();

export type VisitPack = z.infer<typeof visitPackSchema>;
