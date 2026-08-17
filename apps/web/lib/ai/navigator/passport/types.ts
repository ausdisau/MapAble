import { z } from "zod";

/** Structured interpretation shown on the Decision Passport (no chain-of-thought). */
export const passportInterpretationSchema = z
  .object({
    summary: z.string().max(1000).optional(),
    understoodNeeds: z.array(z.string().max(200)).max(30).optional(),
    locationLabel: z.string().max(200).optional(),
    serviceType: z.string().max(200).optional(),
    participantNotes: z.string().max(1000).optional(),
    challenged: z.boolean().optional(),
    challengeNote: z.string().max(1000).optional(),
    correctionNote: z.string().max(1000).optional(),
  })
  .strict();

export type PassportInterpretation = z.infer<typeof passportInterpretationSchema>;

export const hardConstraintSchema = z
  .object({
    id: z.string().min(1).max(80).optional(),
    label: z.string().min(1).max(200),
    value: z.union([z.string().max(200), z.boolean(), z.number()]).optional(),
    source: z.string().max(120).optional(),
    /** Participant marks this constraint as non-negotiable (cannot be quietly dropped). */
    nonNegotiable: z.boolean().optional(),
  })
  .strict();

export type HardConstraint = z.infer<typeof hardConstraintSchema>;

export const hardConstraintsSchema = z.array(hardConstraintSchema).max(50);

export const rankingWeightsSchema = z
  .object({
    proximity: z.number().min(0).max(1).optional(),
    accessibilityFit: z.number().min(0).max(1).optional(),
    availability: z.number().min(0).max(1).optional(),
    participantPreference: z.number().min(0).max(1).optional(),
    other: z.record(z.string(), z.number().min(0).max(1)).optional(),
  })
  .strict();

export type RankingWeights = z.infer<typeof rankingWeightsSchema>;

export const shortlistItemSchema = z
  .object({
    id: z.string().min(1).max(120),
    label: z.string().min(1).max(300),
    factors: z.array(z.string().max(200)).max(20).default([]),
    score: z.number().optional(),
    rejected: z.boolean().optional(),
    rejectReason: z.string().max(500).optional(),
  })
  .strict();

export type ShortlistItem = z.infer<typeof shortlistItemSchema>;

export const shortlistSchema = z.array(shortlistItemSchema).max(30);

export const sourceRefSchema = z
  .object({
    id: z.string().max(120).optional(),
    label: z.string().min(1).max(200),
    kind: z.string().max(80).optional(),
  })
  .strict();

export const passportCreateSchema = z
  .object({
    tenantId: z.string().min(1),
    participantId: z.string().min(1),
    actorUserId: z.string().min(1),
    sessionId: z.string().min(1),
    goalSummary: z.string().min(1).max(500),
    interpretation: passportInterpretationSchema.default({}),
    hardConstraints: hardConstraintsSchema.default([]),
    rankingWeights: rankingWeightsSchema.default({}),
    sources: z.array(sourceRefSchema).max(50).default([]),
    shortlist: shortlistSchema.default([]),
    uncertaintyNotes: z.array(z.string().max(300)).max(20).default([]),
    limitationsNotes: z.array(z.string().max(300)).max(20).default([]),
    conflictsOfInterest: z.array(z.string().max(300)).max(20).default([]),
    aiInvolved: z.boolean().default(false),
    modelIndependentRules: z.array(z.string().max(300)).max(30).default([]),
    nextStep: z.string().max(500).nullable().optional(),
    nextStepController: z.string().max(80).default("participant"),
    consentedPurpose: z.string().min(1).max(200),
    consentRecordId: z.string().min(1).nullable().optional(),
  })
  .strict();

export type PassportCreateInput = z.infer<typeof passportCreateSchema>;

/** Participant-facing Decision Passport projection — never includes chain-of-thought. */
export type DecisionPassportView = {
  id: string;
  tenantId: string;
  participantId: string;
  sessionId: string;
  status: string;
  goal: string;
  interpretation: PassportInterpretation;
  hardConstraints: HardConstraint[];
  rankingWeights: RankingWeights;
  sources: Array<{ id?: string; label: string; kind?: string }>;
  shortlist: ShortlistItem[];
  uncertaintyNotes: string[];
  limitationsNotes: string[];
  conflictsOfInterest: string[];
  aiInvolved: boolean;
  aiOptedOut: boolean;
  modelIndependentRules: string[];
  nextStep: string | null;
  nextStepController: string;
  consentedPurpose: string;
  routes: {
    correct: string;
    reject: string;
    optOut: string;
    humanHelp: string;
    continueWithoutAi: string;
  };
  createdAt: string;
  updatedAt: string;
};
