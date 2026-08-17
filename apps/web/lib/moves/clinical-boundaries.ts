import { movesRehabilitationConfig } from "@/lib/config/moves-rehabilitation";

export type ForbiddenClinicalAction =
  | "diagnose"
  | "prescribe"
  | "alter_treatment"
  | "increase_intensity"
  | "interpret_symptoms_as_diagnosis"
  | "emergency_advice_outside_pathway";

export type ClinicalActionKind =
  | ForbiddenClinicalAction
  | "schedule_activity"
  | "record_completion"
  | "acknowledge_plan"
  | "request_review"
  | "import_device_data"
  | "create_telehealth_session";

export interface ClinicalBoundaryResult {
  allowed: boolean;
  action: ClinicalActionKind;
  reason?: string;
}

const FORBIDDEN_ACTIONS: ForbiddenClinicalAction[] = [
  "diagnose",
  "prescribe",
  "alter_treatment",
  "increase_intensity",
  "interpret_symptoms_as_diagnosis",
  "emergency_advice_outside_pathway",
];

const FORBIDDEN_CONFIG_MAP: Record<
  "diagnose" | "prescribe" | "alter_treatment" | "increase_intensity",
  keyof typeof movesRehabilitationConfig
> = {
  diagnose: "diagnoseEnabled",
  prescribe: "prescribeEnabled",
  alter_treatment: "alterTreatmentEnabled",
  increase_intensity: "intensityAutoIncreaseEnabled",
};

export function classifyClinicalAction(
  action: ClinicalActionKind,
): ClinicalBoundaryResult {
  if ((FORBIDDEN_ACTIONS as readonly string[]).includes(action)) {
    const configKey = FORBIDDEN_CONFIG_MAP[action as keyof typeof FORBIDDEN_CONFIG_MAP];
    if (configKey && movesRehabilitationConfig[configKey]) {
      return { allowed: true, action };
    }
    return {
      allowed: false,
      action,
      reason: `Forbidden clinical action: ${action}. Only authorised professionals may create or approve treatment instructions.`,
    };
  }

  return { allowed: true, action };
}

export function assertClinicalBoundaryAllowed(action: ClinicalActionKind): void {
  const result = classifyClinicalAction(action);
  if (!result.allowed) {
    throw new Error(`CLINICAL_BOUNDARY_VIOLATION:${action}`);
  }
}

export function isForbiddenClinicalAction(
  action: string,
): action is ForbiddenClinicalAction {
  return (FORBIDDEN_ACTIONS as readonly string[]).includes(action);
}

/** Completion records activity adherence — NOT clinical improvement. */
export const COMPLETION_NOT_IMPROVEMENT_DISCLAIMER =
  "Activity completion records participation only. It is not proof of clinical improvement.";
