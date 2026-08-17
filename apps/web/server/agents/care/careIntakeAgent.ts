import type {
  CareIntakeResult,
  CareRequestTypeValue,
  CareSupportTransformInput,
  RiskSignal,
} from "@/server/agents/care/types";

const PERSONAL_CARE_PATTERNS =
  /\b(personal care|shower|dressing|toileting|hygiene|bathing)\b/i;
const DOMESTIC_PATTERNS =
  /\b(cleaning|domestic|housework|laundry|home maintenance)\b/i;
const MEAL_PATTERNS = /\b(meal|food prep|cooking|nutrition)\b/i;
const COMMUNITY_PATTERNS =
  /\b(community access|outing|social|shopping trip|go out)\b/i;
const APPOINTMENT_PATTERNS =
  /\b(appointment|physio|doctor|clinic|hospital visit|therapy)\b/i;
const OVERNIGHT_PATTERNS = /\b(overnight|sleepover|night support)\b/i;
const EMPLOYMENT_PATTERNS = /\b(employment|job|workplace)\b/i;

const MANUAL_HANDLING_PATTERNS =
  /\b(manual handling|hoist|two[- ]person|transfer|lift assist)\b/i;
const MEDICATION_PATTERNS =
  /\b(medication|meds|pill|dosage|remind me to take)\b/i;
const BEHAVIOUR_PATTERNS =
  /\b(behaviour|behavior|meltdown|aggression|de-?escalat)\b/i;
const SAFEGUARDING_PATTERNS =
  /\b(safeguard|neglect|abuse|unsafe at home|reportable)\b/i;
const DIAGNOSIS_PATTERNS =
  /\b(diagnos(e|is|ed)|i have autism|i am autistic|schizophrenia|bipolar disorder)\b/i;
const NDIS_ELIGIBILITY_PATTERNS =
  /\b(ndis eligible|am i eligible|qualify for ndis|ndis funding approved)\b/i;

const TRANSPORT_PATTERNS =
  /\b(transport|wheelchair taxi|pick up|drop off|driver)\b/i;

function inferRequestType(message: string): CareRequestTypeValue {
  if (PERSONAL_CARE_PATTERNS.test(message)) return "personal_care";
  if (OVERNIGHT_PATTERNS.test(message)) return "overnight_support";
  if (MEAL_PATTERNS.test(message)) return "meal_preparation";
  if (DOMESTIC_PATTERNS.test(message)) return "domestic_assistance";
  if (APPOINTMENT_PATTERNS.test(message)) return "appointment_support";
  if (COMMUNITY_PATTERNS.test(message)) return "community_access";
  if (EMPLOYMENT_PATTERNS.test(message)) return "employment_support";
  return "other";
}

function titleFromType(type: CareRequestTypeValue, message: string): string {
  const firstSentence = message.split(/[.!?]/)[0]?.trim().slice(0, 120);
  if (firstSentence && firstSentence.length >= 8) {
    return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
  }
  const labels: Record<CareRequestTypeValue, string> = {
    personal_care: "Personal care support",
    domestic_assistance: "Domestic assistance",
    community_access: "Community access support",
    appointment_support: "Appointment support",
    employment_support: "Employment support",
    meal_preparation: "Meal preparation support",
    therapy_assistance: "Therapy assistance",
    skill_building: "Skill building support",
    overnight_support: "Overnight support",
    other: "Care and support request",
  };
  return labels[type];
}

function detectRiskSignals(
  message: string,
  assessmentSignals: Record<string, unknown>
): RiskSignal[] {
  const signals = new Set<RiskSignal>();
  const combined = `${message} ${JSON.stringify(assessmentSignals)}`.toLowerCase();

  if (MANUAL_HANDLING_PATTERNS.test(combined)) signals.add("manual_handling");
  if (MEDICATION_PATTERNS.test(combined)) signals.add("medication_prompting");
  if (BEHAVIOUR_PATTERNS.test(combined)) signals.add("behaviour_support");
  if (SAFEGUARDING_PATTERNS.test(combined)) signals.add("safeguarding");
  if (DIAGNOSIS_PATTERNS.test(combined)) {
    signals.add("clinical_diagnosis_language");
  }
  if (NDIS_ELIGIBILITY_PATTERNS.test(combined)) {
    signals.add("ndis_eligibility_language");
  }

  if (assessmentSignals.manualHandling === true) signals.add("manual_handling");
  if (assessmentSignals.medicationPrompting === true) {
    signals.add("medication_prompting");
  }
  if (assessmentSignals.behaviourSupport === true) {
    signals.add("behaviour_support");
  }
  if (assessmentSignals.safeguardingConcern === true) {
    signals.add("safeguarding");
  }

  return [...signals];
}

function extractScheduling(
  message: string,
  assessmentSignals: Record<string, unknown>
): CareIntakeResult["schedulingHints"] {
  const hints: CareIntakeResult["schedulingHints"] = {};

  if (typeof assessmentSignals.preferredDate === "string") {
    hints.preferredDate = assessmentSignals.preferredDate;
  }
  if (typeof assessmentSignals.startTime === "string") {
    hints.startTime = assessmentSignals.startTime;
  }
  if (typeof assessmentSignals.endTime === "string") {
    hints.endTime = assessmentSignals.endTime;
  }
  if (typeof assessmentSignals.location === "string") {
    hints.locationHint = assessmentSignals.location;
  }

  const dayMatch = message.match(
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|next week)\b/i
  );
  if (dayMatch && !hints.preferredDate) {
    hints.locationHint = hints.locationHint ?? dayMatch[0];
  }

  const timeMatch = message.match(/\b(\d{1,2}(:\d{2})?\s?(am|pm))\b/i);
  if (timeMatch && !hints.startTime) {
    hints.startTime = timeMatch[0];
  }

  const suburbMatch = message.match(/\bin\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/);
  if (suburbMatch) {
    hints.locationHint = suburbMatch[1];
  }

  return hints;
}

export function runCareIntakeAgent(
  input: CareSupportTransformInput
): CareIntakeResult {
  const normalizedMessage = input.message.trim().replace(/\s+/g, " ");
  const inferredRequestType = inferRequestType(normalizedMessage);
  const riskSignals = detectRiskSignals(
    normalizedMessage,
    input.assessmentSignals
  );
  const auditFlags: string[] = [];

  if (riskSignals.includes("clinical_diagnosis_language")) {
    auditFlags.push("clinical_language_detected_not_used_for_diagnosis");
  }
  if (riskSignals.includes("ndis_eligibility_language")) {
    auditFlags.push("ndis_eligibility_language_detected_not_evaluated");
  }

  const shareAccessibility =
    input.preferences.shareAccessibility === true ||
    input.assessmentSignals.shareAccessibility === true;

  let accessNotesCandidate: string | undefined;
  if (shareAccessibility) {
    if (typeof input.preferences.accessRequirementsSummary === "string") {
      accessNotesCandidate = input.preferences.accessRequirementsSummary;
    } else if (typeof input.assessmentSignals.accessRequirements === "string") {
      accessNotesCandidate = input.assessmentSignals.accessRequirements;
    }
  }

  return {
    normalizedMessage,
    inferredRequestType,
    titleHint: titleFromType(inferredRequestType, normalizedMessage),
    schedulingHints: extractScheduling(
      normalizedMessage,
      input.assessmentSignals
    ),
    riskSignals,
    linkedTransportRequired:
      TRANSPORT_PATTERNS.test(normalizedMessage) ||
      input.preferences.linkedTransportRequired === true ||
      input.assessmentSignals.linkedTransportRequired === true,
    accessNotesCandidate,
    auditFlags,
  };
}
