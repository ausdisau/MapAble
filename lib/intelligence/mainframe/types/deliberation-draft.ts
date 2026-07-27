import { z } from "zod";

export const goalCategorySchema = z.enum([
  "COORDINATE_SUPPORTED_APPOINTMENT",
  "AMBIGUOUS",
  "PROHIBITED",
]);

export const deliberationDraftSchema = z
  .object({
    draftStatus: z.enum(["COMPLETE", "INCOMPLETE", "DENIED"]),
    goalCategory: goalCategorySchema,
    missingFields: z.array(z.string()),
    candidateProposals: z.array(
      z.object({
        id: z.string(),
        workerId: z.string(),
        vehicleId: z.string(),
        summary: z.string(),
        evidenceReferences: z.array(z.string()),
      })
    ).max(3),
    constraintChecks: z.array(z.string()),
    uncertainties: z.array(z.string()),
    threatSignals: z.array(z.string()),
    suggestedHumanReview: z.boolean(),
    evidenceReferences: z.array(z.string()),
  })
  .strict();

export type DeliberationDraft = z.infer<typeof deliberationDraftSchema>;

export type MainframeOutcome = {
  outcome: "RECOMMEND" | "CLARIFY" | "ESCALATE" | "DENY";
  reasonCodes: string[];
  draft: DeliberationDraft;
  humanFallback: string;
  noActionTaken: true;
};
