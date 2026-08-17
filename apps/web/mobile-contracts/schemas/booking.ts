import { z } from "zod";

export const bookingSummarySchema = z.object({
  id: z.string(),
  status: z.string(),
  serviceType: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

export type BookingSummary = z.infer<typeof bookingSummarySchema>;
