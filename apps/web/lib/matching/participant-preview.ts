/**
 * Fictional matching demonstration: no real workers, identifiers, screening
 * credentials, availability confirmations, worker scores or booking authority.
 */
export type CommunicationNeed = "aac" | "extra_time" | "auslan" | "spoken";
export type Competency = "personal_care" | "aac_support" | "manual_handling" | "high_intensity";
export type TimeWindow = "weekday_morning" | "weekday_afternoon" | "evening" | "weekend";
export type ScreeningState =
  | "Clearance"
  | "Pending"
  | "Interim bar"
  | "Exclusion"
  | "Suspension"
  | "No valid clearance"
  | "Not independently verified";

export type ParticipantCriteria = {
  communicationNeeds: CommunicationNeed[];
  requiredCompetencies: Competency[];
  preferredWindow: TimeWindow | "unspecified";
  familiarWorkerIds: string[];
  excludedWorkerIds: string[];
};

export type FictionalWorker = {
  id: string;
  label: string;
  communicationSupports: CommunicationNeed[];
  competencies: { type: Competency; evidence: "fictional_record" | "self_report" }[];
  possibleTimeWindows: TimeWindow[];
  fictionalScreening: ScreeningState;
};

export type EvidenceFactor = {
  topic: string;
  state: "fictional_only" | "needs_confirmation" | "unknown" | "blocked" | "not_requested";
  explanation: string;
};

export type CandidatePreview = {
  workerId: string;
  label: string;
  screeningLabel: ScreeningState;
  factors: EvidenceFactor[];
  discussionOnly: boolean;
  // These invariants must never be overridden by client state or fixtures.
  verifiedScreening: false;
  verifiedCompetence: false;
  confirmedAvailability: false;
  canBook: false;
  humanReviewRequired: true;
  synthetic: true;
};

const RESTRICTED = new Set<ScreeningState>([
  "Interim bar",
  "Exclusion",
  "Suspension",
  "No valid clearance",
]);

export const EMPTY_CRITERIA: ParticipantCriteria = {
  communicationNeeds: [],
  requiredCompetencies: [],
  preferredWindow: "unspecified",
  familiarWorkerIds: [],
  excludedWorkerIds: [],
};

export const FICTIONAL_WORKERS: readonly FictionalWorker[] = [
  {
    id: "example-a",
    label: "Example Worker A (fictional)",
    communicationSupports: ["aac", "extra_time", "spoken"],
    competencies: [
      { type: "personal_care", evidence: "fictional_record" },
      { type: "aac_support", evidence: "fictional_record" },
    ],
    possibleTimeWindows: ["weekday_morning", "weekday_afternoon"],
    fictionalScreening: "Clearance",
  },
  {
    id: "example-b",
    label: "Example Worker B (fictional)",
    communicationSupports: ["spoken", "auslan"],
    competencies: [{ type: "personal_care", evidence: "self_report" }],
    possibleTimeWindows: ["weekend"],
    fictionalScreening: "Pending",
  },
  {
    id: "example-c",
    label: "Example Worker C (fictional)",
    communicationSupports: ["aac", "extra_time"],
    competencies: [{ type: "high_intensity", evidence: "fictional_record" }],
    possibleTimeWindows: ["weekday_morning", "weekend"],
    fictionalScreening: "Interim bar",
  },
];

export function reviewFictionalWorker(
  criteria: ParticipantCriteria,
  worker: FictionalWorker,
): CandidatePreview {
  const excluded = criteria.excludedWorkerIds.includes(worker.id);
  const restricted = RESTRICTED.has(worker.fictionalScreening);
  const missingCommunication = criteria.communicationNeeds.filter(
    (need) => !worker.communicationSupports.includes(need),
  );
  const missingCompetence = criteria.requiredCompetencies.filter(
    (need) => worker.competencies.find((item) => item.type === need)?.evidence !== "fictional_record",
  );
  const statedTime = worker.possibleTimeWindows.includes(
    criteria.preferredWindow as TimeWindow,
  );
  const factors: EvidenceFactor[] = [
    {
      topic: "Worker screening",
      state: restricted ? "blocked" : "needs_confirmation",
      explanation:
        "Fictional screening status: " + worker.fictionalScreening +
        ". No authoritative worker screening check has been performed. " +
        (restricted ? "Do not progress this fictional scenario while this restriction applies." :
        "Even a fictional Clearance label is NOT a verified clearance."),
    },
    {
      topic: "Communication access",
      state: criteria.communicationNeeds.length === 0 ? "not_requested" :
        missingCommunication.length > 0 ? "unknown" : "fictional_only",
      explanation: criteria.communicationNeeds.length === 0
        ? "No communication requirements selected."
        : missingCommunication.length > 0
          ? "The fictional profile does not document every selected communication requirement. Ask the worker directly; this does not prove inability."
          : "All selected communication methods are listed in the fictional profile, but practical AAC competence is not verified.",
    },
    {
      topic: "Competencies",
      state: criteria.requiredCompetencies.length === 0 ? "not_requested" :
        missingCompetence.length > 0 ? "needs_confirmation" : "fictional_only",
      explanation: criteria.requiredCompetencies.length === 0
        ? "No specific competencies selected."
        : missingCompetence.length > 0
          ? "Required competency evidence is missing or self-reported. Verification and task-specific assessment are required."
          : "Mock competency documents exist in this scenario. This is not independent clinical or support competency verification.",
    },
    {
      topic: "Availability",
      state: criteria.preferredWindow === "unspecified" ? "not_requested" :
        statedTime ? "needs_confirmation" : "unknown",
      explanation: criteria.preferredWindow === "unspecified"
        ? "No time preference selected."
        : statedTime
          ? "A fictional time window is listed. Real availability and shift conflicts have not been checked."
          : "The fictional profile does not show your chosen time. Availability remains unconfirmed.",
    },
    {
      topic: "Continuity",
      state: criteria.familiarWorkerIds.includes(worker.id) ? "fictional_only" : "not_requested",
      explanation: criteria.familiarWorkerIds.includes(worker.id)
        ? "You personally marked this fictional worker as familiar in this session."
        : "No familiarity or prior relationship inferred.",
    },
  ];

  if (excluded) {
    factors.push({
      topic: "Participant choice",
      state: "blocked",
      explanation: "You chose not to consider this fictional worker.",
    });
  }

  return {
    workerId: worker.id,
    label: worker.label,
    screeningLabel: worker.fictionalScreening,
    factors,
    discussionOnly: !restricted && !excluded,
    verifiedScreening: false,
    verifiedCompetence: false,
    confirmedAvailability: false,
    canBook: false,
    humanReviewRequired: true,
    synthetic: true,
  };
}
