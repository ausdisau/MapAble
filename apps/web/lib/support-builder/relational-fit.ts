import { z } from "zod";

/**
 * Relational Fit v1 is a comparison of voluntary, observable work practices.
 * It is NOT a psychometric test, personality label, suitability assessment,
 * safety clearance, employment screen, or prediction of relationship quality.
 */
export const COMMUNICATION_MODES = [
  "text",
  "aac",
  "spoken",
  "auslan",
  "easy_read",
] as const;

const Mode = z.enum(COMMUNICATION_MODES);
const Importance = z.enum(["essential", "preferred"]);
const preference = <T extends [string, ...string[]]>(values: T) =>
  z.object({
    value: z.enum(values),
    importance: Importance,
  });

export const ParticipantFitRequestSchema = z.object({
  communicationModes: z.array(Mode).max(5).default([]),
  routine: preference(["any", "structured", "flexible"]),
  interaction: preference(["any", "quiet", "conversational"]),
  initiative: preference(["any", "ask_first", "offer_options"]),
  continuity: preference(["any", "regular", "variable"]),
  locality: z.string().trim().max(100).default(""),
  // Future request-specific service checks are separate from workstyle.
});
export type ParticipantFitRequest = z.infer<typeof ParticipantFitRequestSchema>;

export const WorkerFitDeclarationSchema = z.object({
  workerProfileId: z.string().min(1).max(150),
  communicationModes: z.array(Mode).min(1).max(5),
  routineStyle: z.enum(["not_stated", "structured", "flexible", "adaptable"]),
  interactionStyle: z.enum(["not_stated", "quiet", "conversational", "adaptable"]),
  initiativeStyle: z.enum(["not_stated", "ask_first", "offer_options", "adaptable"]),
  continuityStyle: z.enum(["not_stated", "regular", "variable", "adaptable"]),
  // An explicit opt-in is required for each saved or revised profile.
  consentToMatching: z.literal(true),
});
export type WorkerFitDeclaration = z.infer<typeof WorkerFitDeclarationSchema>;

export type DeclaredPractice = Pick<
  WorkerFitDeclaration,
  | "communicationModes"
  | "routineStyle"
  | "interactionStyle"
  | "initiativeStyle"
  | "continuityStyle"
>;

export type FitComparison = {
  fitsEssentialPreferences: boolean;
  alignsWith: string[];
  discussBeforeProceeding: string[];
  unknowns: string[];
  alignmentCount: number;
  basis: "participant_preferences_and_worker_declarations_only";
};

const dimensionLabels = {
  routine: "Routine approach",
  interaction: "Conversation and interaction",
  initiative: "How assistance is offered",
  continuity: "Continuity arrangements",
} as const;

export const DEFAULT_FIT_REQUEST: ParticipantFitRequest = {
  communicationModes: [],
  routine: { value: "any", importance: "preferred" },
  interaction: { value: "any", importance: "preferred" },
  initiative: { value: "any", importance: "preferred" },
  continuity: { value: "any", importance: "preferred" },
  locality: "",
};

export function compareDeclaredPractices(
  requested: ParticipantFitRequest,
  worker: DeclaredPractice,
): FitComparison {
  const alignsWith: string[] = [];
  const discussBeforeProceeding: string[] = [];
  const unknowns: string[] = [];
  let fitsEssentialPreferences = true;

  const advertised = new Set(worker.communicationModes);
  for (const mode of requested.communicationModes) {
    if (advertised.has(mode)) {
      alignsWith.push("Worker declares support for " + mode.replace("_", " ") + " communication.");
    } else {
      // Communication access is an essential prerequisite, not a preference
      // to trade off for high scores in unrelated dimensions.
      fitsEssentialPreferences = false;
      unknowns.push("Required communication method " + mode + " is not declared.");
    }
  }

  const dimensions = [
    ["routine", worker.routineStyle],
    ["interaction", worker.interactionStyle],
    ["initiative", worker.initiativeStyle],
    ["continuity", worker.continuityStyle],
  ] as const;

  for (const [dimension, declared] of dimensions) {
    const sought = requested[dimension];
    if (sought.value === "any") continue;

    const label = dimensionLabels[dimension];
    if (declared === "not_stated") {
      unknowns.push(label + " has not been declared by this worker.");
      if (sought.importance === "essential") fitsEssentialPreferences = false;
    } else if (declared === "adaptable" || declared === sought.value) {
      alignsWith.push(
        label + ": worker self-declares " + declared.replace("_", " ") + ".",
      );
    } else {
      discussBeforeProceeding.push(
        label + ": you selected " + sought.value.replace("_", " ") +
          "; worker self-declares " + declared.replace("_", " ") + ".",
      );
      if (sought.importance === "essential") fitsEssentialPreferences = false;
    }
  }

  return {
    fitsEssentialPreferences,
    alignsWith,
    discussBeforeProceeding,
    unknowns,
    alignmentCount: alignsWith.length,
    basis: "participant_preferences_and_worker_declarations_only",
  };
}

export function explainFitRisk(): string {
  return [
    "This tool compares stated preferences and work practices; it does not measure personality or predict relationship success.",
    "A listing is not proof of current NDIS screening, qualifications, competence, service coverage, shift availability or safety.",
    "Workers and participants may choose not to use profiling. No worker is assigned and no employment decision is made by this algorithm.",
    "AI may assist with wording in the wider Support Builder, but this comparison uses deterministic rules and does not transmit preference profiles to an AI model.",
  ].join(" ");
}
