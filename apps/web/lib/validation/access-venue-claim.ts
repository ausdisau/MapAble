import { z } from "zod";

export const submitVenueClaimSchema = z.object({
  businessName: z.string().min(1).max(200).optional(),
  evidenceNote: z.string().max(2000).optional(),
});
