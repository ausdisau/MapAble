import {
  TRIAGE_FUNCTIONAL_DOMAINS,
  type ThrivingKidsTriageData,
} from "@/lib/schemas/thriving-kids-triage";

export type ChildRoutingPathway =
  | "STANDARD_NDIS_PATHWAY"
  | "NDIS_EARLY_CHILDHOOD_APPROACH"
  | "THRIVING_KIDS_STATE_SUPPORT";

export type ChildRoutingResult = {
  pathway: ChildRoutingPathway;
  ageYears: number;
  maxDomainScore: number;
  requiresNdisApplication: boolean;
  nextSteps: string[];
  summary: string;
  notice: string;
};

const HONESTY_NOTICE =
  "Draft routing guidance only. This is not a government Thriving Kids determination, clinical diagnosis, or a claim that MapAble delivers state or NDIS programs. Child data must not be used for advertising or model training.";

/**
 * Completed years of age using UTC calendar dates.
 */
export function ageInCompletedYears(
  dateOfBirthIso: string,
  at: Date = new Date()
): number {
  const [y, m, d] = dateOfBirthIso.split("-").map(Number);
  const birth = new Date(Date.UTC(y, m - 1, d));
  let age = at.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = at.getUTCMonth() - birth.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && at.getUTCDate() < birth.getUTCDate())
  ) {
    age -= 1;
  }
  return Math.max(0, age);
}

function maxFunctionalScore(data: ThrivingKidsTriageData): number {
  return Math.max(
    ...TRIAGE_FUNCTIONAL_DOMAINS.map((key) => data.functionalCapacity[key])
  );
}

function nextStepsFor(pathway: ChildRoutingPathway): string[] {
  switch (pathway) {
    case "THRIVING_KIDS_STATE_SUPPORT":
      return [
        "Review Thriving Kids / foundational supports information for your state or territory.",
        "Connect with local state community and early childhood services for mild-to-moderate needs.",
        "Keep this draft routing summary for discussion with your GP or early childhood provider.",
      ];
    case "NDIS_EARLY_CHILDHOOD_APPROACH":
      return [
        "Start an NDIS Early Childhood Approach access request with an early childhood partner.",
        "Gather existing assessments and functional capacity notes to support the access conversation.",
        "If needs change, re-run this draft triage with updated scores (scaffold only).",
      ];
    case "STANDARD_NDIS_PATHWAY":
      return [
        "Start a standard NDIS access / plan pathway for children over 8 years of age.",
        "Speak with a Local Area Coordinator or support coordinator about next steps.",
        "This scaffold does not submit an NDIS application on your behalf.",
      ];
    default: {
      const _exhaustive: never = pathway;
      return _exhaustive;
    }
  }
}

function summaryFor(
  pathway: ChildRoutingPathway,
  ageYears: number,
  maxDomainScore: number
): string {
  switch (pathway) {
    case "THRIVING_KIDS_STATE_SUPPORT":
      return `Based on age ${ageYears} and low-to-moderate functional scores (max ${maxDomainScore}), draft routing suggests Thriving Kids / state foundational supports.`;
    case "NDIS_EARLY_CHILDHOOD_APPROACH":
      return `Based on age ${ageYears}, presenting concern, and/or higher support needs (max score ${maxDomainScore}), draft routing suggests the NDIS Early Childhood Approach.`;
    case "STANDARD_NDIS_PATHWAY":
      return `Child is over 8 years of age (${ageYears}). Draft routing suggests the standard NDIS pathway rather than Thriving Kids.`;
    default: {
      const _exhaustive: never = pathway;
      return _exhaustive;
    }
  }
}

/**
 * Deterministic parental-intake routing for Thriving Kids vs NDIS pathways.
 */
export function determineChildRoutingPathway(
  data: ThrivingKidsTriageData,
  at: Date = new Date()
): ChildRoutingResult {
  const ageYears = ageInCompletedYears(data.dateOfBirth, at);
  const maxDomainScore = maxFunctionalScore(data);

  let pathway: ChildRoutingPathway;

  const thrivingEligibleConcern =
    data.primaryPresentingConcern === "AUTISM" ||
    data.primaryPresentingConcern === "DEVELOPMENTAL_DELAY";

  if (ageYears > 8) {
    pathway = "STANDARD_NDIS_PATHWAY";
  } else if (maxDomainScore >= 4 || !thrivingEligibleConcern) {
    pathway = "NDIS_EARLY_CHILDHOOD_APPROACH";
  } else {
    pathway = "THRIVING_KIDS_STATE_SUPPORT";
  }

  const requiresNdisApplication = pathway !== "THRIVING_KIDS_STATE_SUPPORT";

  return {
    pathway,
    ageYears,
    maxDomainScore,
    requiresNdisApplication,
    nextSteps: nextStepsFor(pathway),
    summary: summaryFor(pathway, ageYears, maxDomainScore),
    notice: HONESTY_NOTICE,
  };
}
