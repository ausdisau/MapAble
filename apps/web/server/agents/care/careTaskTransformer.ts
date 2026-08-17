import type {
  CareIntakeResult,
  CarePlanDraft,
  CareSupportTransformInput,
  StructuredCareTask,
} from "@/server/agents/care/types";

const HIGH_INTENSITY_PATTERNS =
  /\b(hoist|two[- ]person|high intensity|complex behaviour|behavior support plan|manual handling)\b/i;

function splitTasksFromMessage(message: string): string[] {
  const segments = message
    .split(/[,;]|\band\b|\balso\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 4);
  if (segments.length <= 1) {
    return [message.slice(0, 200)];
  }
  return segments.slice(0, 8);
}

function taskIntensity(segment: string, intake: CareIntakeResult): "standard" | "high" {
  if (HIGH_INTENSITY_PATTERNS.test(segment)) return "high";
  if (
    intake.riskSignals.includes("manual_handling") ||
    intake.riskSignals.includes("behaviour_support")
  ) {
    return "high";
  }
  return "standard";
}

function defaultTasksForType(intake: CareIntakeResult): StructuredCareTask[] {
  const defaults: Record<string, string[]> = {
    personal_care: ["Personal care routines", "Mobility and transfers as described"],
    domestic_assistance: ["Domestic tasks as described"],
    meal_preparation: ["Meal preparation support"],
    community_access: ["Community participation support"],
    appointment_support: ["Appointment attendance support"],
    overnight_support: ["Overnight presence and support"],
    other: ["Support tasks as described"],
  };
  const names = defaults[intake.inferredRequestType] ?? defaults.other;
  return names.map((name) => ({
    name,
    intensity: taskIntensity(name, intake),
    source: "message" as const,
  }));
}

export function runCareTaskTransformer(
  input: CareSupportTransformInput,
  intake: CareIntakeResult
): CarePlanDraft {
  const segments = splitTasksFromMessage(intake.normalizedMessage);
  const tasks: StructuredCareTask[] =
    segments.length > 0
      ? segments.map((segment) => ({
          name: segment.charAt(0).toUpperCase() + segment.slice(1),
          intensity: taskIntensity(segment, intake),
          source: "message" as const,
        }))
      : defaultTasksForType(intake);

  const shareAccessibility =
    input.preferences.shareAccessibility === true ||
    input.assessmentSignals.shareAccessibility === true;
  const shareAccessibilityConfirmed =
    input.preferences.shareAccessibilityConfirmed === true;

  const scheduling = intake.schedulingHints;

  return {
    status: "needs_confirmation",
    bookingStatus: "blocked_until_participant_confirmation",
    requestType: intake.inferredRequestType,
    title: intake.titleHint,
    description: intake.normalizedMessage,
    preferredDate: scheduling.preferredDate,
    startTime: scheduling.startTime,
    endTime: scheduling.endTime,
    suburb: scheduling.locationHint,
    accessRequirementsSummary: shareAccessibilityConfirmed
      ? intake.accessNotesCandidate
      : undefined,
    linkedTransportRequired: intake.linkedTransportRequired,
    shareAccessibility,
    shareAccessibilityConfirmed,
    tasks,
    autoAssignWorkers: false,
    autoFinalizeBooking: false,
  };
}
