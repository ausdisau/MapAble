import { z } from "zod";

export const accessReviewRatingSchema = z.object({
  category: z.string(),
  value: z.enum([
    "not_applicable",
    "unknown",
    "poor",
    "basic",
    "good",
    "excellent",
  ]),
});

export const createAccessReviewSchema = z.object({
  displayNameMode: z
    .enum(["named", "first_name", "anonymous_public"])
    .default("anonymous_public"),
  visitDate: z.string().datetime().optional(),
  reviewBody: z.string().min(10).max(8000),
  mobilityContext: z.string().max(500).optional(),
  visibility: z.enum(["public", "mapable_only"]).default("public"),
  publish: z.boolean().default(true),
  ratings: z.array(accessReviewRatingSchema).min(1),
});

export const updateAccessReviewSchema = z
  .object({
    reviewBody: z.string().min(10).max(8000).optional(),
    mobilityContext: z.string().max(500).optional(),
    publish: z.boolean().optional(),
  })
  .refine((v) => v.reviewBody != null || v.mobilityContext != null || v.publish != null, {
    message: "At least one field required",
  });
