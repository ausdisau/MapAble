import { jobsParticipationConfig } from "@/lib/config/jobs-participation";

export type ProhibitedJobsAction =
  | "employability_scoring"
  | "automatic_applicant_rejection"
  | "disability_capability_inference"
  | "productivity_ranking"
  | "undisclosed_disability_sharing";

const PROHIBITED_MESSAGES: Record<ProhibitedJobsAction, string> = {
  employability_scoring:
    "Employability scoring is prohibited in CareOS jobs participation.",
  automatic_applicant_rejection:
    "Automatic applicant rejection is prohibited — all decisions require human review.",
  disability_capability_inference:
    "Inferring capability from disability is prohibited.",
  productivity_ranking:
    "Productivity-based ranking is prohibited — only transparent requirement explanations are permitted.",
  undisclosed_disability_sharing:
    "Disability or adjustment information cannot be shared without participant consent.",
};

export function assertJobsFairnessAllowed(action: ProhibitedJobsAction): void {
  switch (action) {
    case "employability_scoring":
      if (jobsParticipationConfig.employabilityScoringEnabled) {
        throw new Error("PROHIBITED_EMPLOYABILITY_SCORING");
      }
      break;
    case "automatic_applicant_rejection":
      if (jobsParticipationConfig.automaticApplicantRejectionEnabled) {
        throw new Error("PROHIBITED_AUTOMATIC_REJECTION");
      }
      break;
    case "disability_capability_inference":
      if (jobsParticipationConfig.disabilityInferenceEnabled) {
        throw new Error("PROHIBITED_DISABILITY_INFERENCE");
      }
      break;
    case "productivity_ranking":
      if (jobsParticipationConfig.productivityRankingEnabled) {
        throw new Error("PROHIBITED_PRODUCTIVITY_RANKING");
      }
      break;
    case "undisclosed_disability_sharing":
      break;
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function getProhibitedActionMessage(
  action: ProhibitedJobsAction,
): string {
  return PROHIBITED_MESSAGES[action];
}
