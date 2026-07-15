import type {
  AccessFitLabel,
  AccessFitResult,
  AccessNeed,
  PlaceAccessProfile,
} from "@/lib/access-fit/types";

type NeedCheck = {
  needed: boolean;
  value: boolean | null;
  matchLabel: string;
  barrierLabel: string;
  unknownLabel: string;
  question: string;
  weight: number;
};

function labelForScore(
  score: number,
  barriers: string[],
  unknowns: string[],
  activeNeeds: number,
): AccessFitLabel {
  if (activeNeeds === 0) return "unknown";
  if (barriers.length > 0 && score < 40) return "likely barrier";
  if (barriers.length > 0) return "needs confirmation";
  if (unknowns.length > 0 && score < 70) return "needs confirmation";
  if (score >= 80 && unknowns.length === 0) return "strong fit";
  if (score >= 55) return "possible fit";
  if (unknowns.length >= activeNeeds) return "unknown";
  return "needs confirmation";
}

export function calculateAccessFit(
  accessNeeds: AccessNeed,
  placeProfile: PlaceAccessProfile,
): AccessFitResult {
  const checks: NeedCheck[] = [
    {
      needed: accessNeeds.stepFreeRequired || accessNeeds.wheelchairUser || accessNeeds.powerchairUser,
      value: placeProfile.stepFreeEntry,
      matchLabel: "Step-free entry",
      barrierLabel: "No step-free entry reported",
      unknownLabel: "Step-free entry unknown",
      question: "Is there a step-free entrance I can use?",
      weight: 3,
    },
    {
      needed: accessNeeds.wheelchairUser || accessNeeds.powerchairUser,
      value:
        placeProfile.doorWidthMm == null
          ? null
          : placeProfile.doorWidthMm >= (accessNeeds.powerchairUser ? 900 : 850),
      matchLabel:
        placeProfile.doorWidthMm != null
          ? `Door width ${placeProfile.doorWidthMm} mm`
          : "Adequate door width",
      barrierLabel: "Door may be too narrow",
      unknownLabel: "Door width unknown",
      question: "What is the clear door width at the entrance?",
      weight: 2,
    },
    {
      needed: accessNeeds.stepFreeRequired || accessNeeds.wheelchairUser || accessNeeds.powerchairUser,
      value: placeProfile.internalStepFree,
      matchLabel: "Internal step-free movement",
      barrierLabel: "Internal steps or level changes reported",
      unknownLabel: "Internal step-free route unknown",
      question: "Can I move inside without steps?",
      weight: 2,
    },
    {
      needed: accessNeeds.accessibleToiletRequired,
      value: placeProfile.accessibleToilet,
      matchLabel: "Accessible toilet",
      barrierLabel: "No accessible toilet reported",
      unknownLabel: "Accessible toilet unknown",
      question: "Is there an accessible toilet, and is it in use?",
      weight: 3,
    },
    {
      needed: accessNeeds.accessibleParkingNeeded,
      value: placeProfile.accessibleParking,
      matchLabel: "Accessible parking",
      barrierLabel: "No accessible parking reported",
      unknownLabel: "Accessible parking unknown",
      question: "Is accessible parking available nearby?",
      weight: 2,
    },
    {
      needed: accessNeeds.dropOffNeeded,
      value: placeProfile.dropOffPoint,
      matchLabel: "Drop-off point",
      barrierLabel: "No drop-off point reported",
      unknownLabel: "Drop-off point unknown",
      question: "Where can a vehicle drop me close to the entrance?",
      weight: 2,
    },
    {
      needed: accessNeeds.lowSensoryNeeded,
      value: placeProfile.lowSensoryOption,
      matchLabel: "Quiet or sensory-friendly option",
      barrierLabel: "No quiet or sensory-friendly option reported",
      unknownLabel: "Sensory options unknown",
      question: "Is there a quieter time or low-sensory space?",
      weight: 2,
    },
    {
      needed: accessNeeds.hearingLoopNeeded,
      value: placeProfile.hearingLoop,
      matchLabel: "Hearing loop",
      barrierLabel: "No hearing loop reported",
      unknownLabel: "Hearing loop unknown",
      question: "Is a hearing loop available and working?",
      weight: 1,
    },
    {
      needed: accessNeeds.AuslanNeeded || accessNeeds.AACFriendlyNeeded,
      value: placeProfile.staffTraining,
      matchLabel: "Staff assistance / training noted",
      barrierLabel: "Staff assistance availability not confirmed",
      unknownLabel: "Staff training unknown",
      question: "Can staff support Auslan, AAC, or other communication needs?",
      weight: 2,
    },
    {
      needed: accessNeeds.assistanceAnimal,
      value: placeProfile.assistanceAnimalWelcome,
      matchLabel: "Assistance animal welcome",
      barrierLabel: "Assistance animal policy unclear or unwelcome",
      unknownLabel: "Assistance animal policy unknown",
      question: "Are assistance animals welcome?",
      weight: 2,
    },
    {
      needed: accessNeeds.transportSupportNeeded,
      value: placeProfile.transportBookable,
      matchLabel: "Transport bookable",
      barrierLabel: "Transport not bookable through MapAble for this place",
      unknownLabel: "Transport bookability unknown",
      question: "Can I book accessible transport to this place?",
      weight: 2,
    },
    {
      needed: accessNeeds.fatigueBufferNeeded,
      value: placeProfile.publicTransportNearby,
      matchLabel: "Public transport nearby (helps planning buffers)",
      barrierLabel: "Public transport may be limited nearby",
      unknownLabel: "Public transport proximity unknown",
      question: "How long should I allow for fatigue and transfer time?",
      weight: 1,
    },
  ];

  const matches: string[] = [];
  const barriers: string[] = [];
  const unknowns: string[] = [];
  const recommendedQuestions: string[] = [];

  let earned = 0;
  let possible = 0;
  let activeNeeds = 0;

  for (const check of checks) {
    if (!check.needed) continue;
    activeNeeds += 1;
    possible += check.weight;
    if (check.value === true) {
      matches.push(check.matchLabel);
      earned += check.weight;
    } else if (check.value === false) {
      barriers.push(check.barrierLabel);
      recommendedQuestions.push(check.question);
    } else {
      unknowns.push(check.unknownLabel);
      recommendedQuestions.push(check.question);
    }
  }

  if (placeProfile.confidence === "low" || placeProfile.confidence === "unknown") {
    recommendedQuestions.push("When was this access information last checked?");
  }

  const score =
    possible === 0 ? 0 : Math.max(0, Math.min(100, Math.round((earned / possible) * 100)));

  return {
    score,
    label: labelForScore(score, barriers, unknowns, activeNeeds),
    matches,
    barriers,
    unknowns,
    recommendedQuestions: [...new Set(recommendedQuestions)],
  };
}
