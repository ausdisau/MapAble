import { z } from "zod";

/** Mirrors DB CHECK on navigator_feedback.rating (1–5 or null). */
export const navigatorFeedbackRatingSchema = z
  .number()
  .int()
  .min(1)
  .max(5)
  .nullable()
  .optional();

export const createNavigatorFeedbackInputSchema = z.object({
  assignmentId: z.string().min(1),
  participantId: z.string().min(1),
  rating: navigatorFeedbackRatingSchema,
  comment: z.string().max(4000).nullable().optional(),
});

export type CreateNavigatorFeedbackInput = z.infer<
  typeof createNavigatorFeedbackInputSchema
>;
