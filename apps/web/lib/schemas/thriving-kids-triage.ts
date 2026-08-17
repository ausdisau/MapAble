import { z } from "zod";

/**
 * Parental intake schema for Thriving Kids foundational triage (scaffold).
 *
 * Domain fields are a simplified I-CAN v6 subset with 1–5 support-need scores.
 * Mapping to full I-CAN v6 labels in lib/billing/replacement-support.ts:
 * - communication → communication
 * - interpersonalInteractions → interpersonal_interactions_relationships
 * - learningAndApplyingKnowledge → learning_applying_knowledge
 * - mobility → mobility
 * - selfCare → self_care
 * - behavioralSelfRegulation → behaviours_of_concern (+ mental_emotional_health)
 */

export const PRIMARY_PRESENTING_CONCERNS = [
  "DEVELOPMENTAL_DELAY",
  "AUTISM",
  "PHYSICAL_DISABILITY",
  "SENSORY_IMPAIRMENT",
  "MENTAL_HEALTH",
  "OTHER",
] as const;

export type PrimaryPresentingConcern =
  (typeof PRIMARY_PRESENTING_CONCERNS)[number];

export const PRIMARY_PRESENTING_CONCERN_LABELS: Record<
  PrimaryPresentingConcern,
  string
> = {
  DEVELOPMENTAL_DELAY: "Developmental delay",
  AUTISM: "Autism",
  PHYSICAL_DISABILITY: "Physical disability",
  SENSORY_IMPAIRMENT: "Sensory impairment",
  MENTAL_HEALTH: "Mental health",
  OTHER: "Other",
};

/** I-CAN v6 simplified domain keys used by this triage scaffold. */
export const TRIAGE_FUNCTIONAL_DOMAINS = [
  "communication",
  "interpersonalInteractions",
  "learningAndApplyingKnowledge",
  "mobility",
  "selfCare",
  "behavioralSelfRegulation",
] as const;

export type TriageFunctionalDomain =
  (typeof TRIAGE_FUNCTIONAL_DOMAINS)[number];

export const TRIAGE_FUNCTIONAL_DOMAIN_LABELS: Record<
  TriageFunctionalDomain,
  string
> = {
  communication: "Communication",
  interpersonalInteractions: "Interpersonal interactions",
  learningAndApplyingKnowledge: "Learning and applying knowledge",
  mobility: "Mobility",
  selfCare: "Self-care",
  behavioralSelfRegulation: "Behavioural self-regulation",
};

/**
 * 1 = Independent … 5 = Requires pervasive/total support
 */
export const FUNCTIONAL_CAPACITY_SCORE_LABELS: Record<1 | 2 | 3 | 4 | 5, string> =
  {
    1: "Independent",
    2: "Occasional support",
    3: "Regular support (low to moderate)",
    4: "Substantial support",
    5: "Requires pervasive/total support",
  };

const FunctionalScoreSchema = z
  .number()
  .int("Score must be a whole number")
  .min(1, "Score must be at least 1 (Independent)")
  .max(5, "Score must be at most 5 (pervasive/total support)");

const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
  .refine((value) => {
    const [y, m, d] = value.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return (
      dt.getUTCFullYear() === y &&
      dt.getUTCMonth() === m - 1 &&
      dt.getUTCDate() === d
    );
  }, "Date of birth is not a valid calendar date");

export const ThrivingKidsTriageSchema = z.object({
  participantId: z.string().trim().min(1, "Participant ID is required"),
  dateOfBirth: IsoDateSchema,
  hasFormalDiagnosis: z.boolean(),
  primaryPresentingConcern: z.enum(PRIMARY_PRESENTING_CONCERNS),
  functionalCapacity: z.object({
    communication: FunctionalScoreSchema,
    interpersonalInteractions: FunctionalScoreSchema,
    learningAndApplyingKnowledge: FunctionalScoreSchema,
    mobility: FunctionalScoreSchema,
    selfCare: FunctionalScoreSchema,
    behavioralSelfRegulation: FunctionalScoreSchema,
  }),
});

export type ThrivingKidsTriageData = z.infer<typeof ThrivingKidsTriageSchema>;
