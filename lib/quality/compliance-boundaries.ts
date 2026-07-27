import { qualityAccreditationConfig } from "@/lib/config/quality-accreditation";

export type ProhibitedQualityAction =
  | "automatic_accreditation_decision"
  | "participant_incident_provider_score"
  | "silent_audit_history_overwrite";

const PROHIBITED_MESSAGES: Record<ProhibitedQualityAction, string> = {
  automatic_accreditation_decision:
    "Automatic accreditation decisions are prohibited — human assessors decide outcomes.",
  participant_incident_provider_score:
    "Deriving provider quality scores from participant incidents is prohibited.",
  silent_audit_history_overwrite:
    "Audit and corrective action history must be append-only — silent overwrites are prohibited.",
};

export function assertQualityComplianceAllowed(
  action: ProhibitedQualityAction,
): void {
  switch (action) {
    case "automatic_accreditation_decision":
      if (qualityAccreditationConfig.automaticAccreditationDecisionEnabled) {
        throw new Error("PROHIBITED_AUTOMATIC_ACCREDITATION_DECISION");
      }
      break;
    case "participant_incident_provider_score":
      if (qualityAccreditationConfig.participantIncidentToProviderScoreEnabled) {
        throw new Error("PROHIBITED_INCIDENT_PROVIDER_SCORE");
      }
      break;
    case "silent_audit_history_overwrite":
      break;
    default: {
      const exhaustive: never = action;
      return exhaustive;
    }
  }
}

export function getProhibitedQualityMessage(
  action: ProhibitedQualityAction,
): string {
  return PROHIBITED_MESSAGES[action];
}
