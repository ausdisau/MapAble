import { z } from "zod";

export const normalizedPointSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

export type NormalizedPoint = z.infer<typeof normalizedPointSchema>;
