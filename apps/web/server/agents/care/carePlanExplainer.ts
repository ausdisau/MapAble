import type {
  CareGuardrailResult,
  CareIntakeResult,
  CarePlanDraft,
  WorkerCapabilityRequirement,
} from "@/server/agents/care/types";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  personal_care: "personal care",
  domestic_assistance: "domestic assistance",
  community_access: "community access",
  appointment_support: "appointment support",
  employment_support: "employment support",
  meal_preparation: "meal preparation",
  therapy_assistance: "therapy assistance",
  skill_building: "skill building",
  overnight_support: "overnight support",
  other: "care and support",
};

export function runCarePlanExplainer(params: {
  intake: CareIntakeResult;
  carePlanDraft: CarePlanDraft;
  guardrail: CareGuardrailResult;
  requiredCapabilities: WorkerCapabilityRequirement[];
}): string {
  const { intake, carePlanDraft, guardrail, requiredCapabilities } = params;
  const typeLabel =
    REQUEST_TYPE_LABELS[carePlanDraft.requestType] ?? "care and support";
  const taskCount = carePlanDraft.tasks.length;
  const taskPreview = carePlanDraft.tasks
    .slice(0, 3)
    .map((t) => t.name)
    .join("; ");

  const lines: string[] = [
    `We understood your request as ${typeLabel} support.`,
    `Draft title: "${carePlanDraft.title}".`,
  ];

  if (taskCount > 0) {
    lines.push(
      `We grouped ${taskCount} task${taskCount === 1 ? "" : "s"}${taskPreview ? ` (for example: ${taskPreview})` : ""}.`
    );
  }

  if (carePlanDraft.linkedTransportRequired) {
    lines.push(
      "You may also need transport — that would be arranged separately after you confirm this care draft."
    );
  }

  lines.push(
    "This is a draft only: we do not diagnose conditions, decide NDIS eligibility, book services, or assign workers automatically."
  );

  lines.push(
    "Please review the details and confirm before anything is sent to providers."
  );

  if (guardrail.guardrailDecision.personalCareConfirmationRequired) {
    lines.push(
      "Because this involves personal care, you must confirm exactly what support you want before providers see it."
    );
  }

  if (guardrail.guardrailDecision.humanReviewRequired) {
    lines.push(
      "A team member may review this request because it mentions safety-related support (for example manual handling, medication prompting, behaviour support, or safeguarding)."
    );
  }

  if (guardrail.missingInformation.length > 0) {
    lines.push(
      `We still need: ${guardrail.missingInformation.slice(0, 3).join("; ")}.`
    );
  }

  if (requiredCapabilities.length > 0) {
    const capLabels = requiredCapabilities
      .filter((c) => c.required)
      .slice(0, 3)
      .map((c) => c.label)
      .join(", ");
    if (capLabels) {
      lines.push(
        `When you are ready to proceed, matching workers would need: ${capLabels} (informational only — no automatic assignment).`
      );
    }
  }

  if (intake.auditFlags.includes("ndis_eligibility_language_detected_not_evaluated")) {
    lines.push(
      "We cannot tell you if you are NDIS-eligible here — please contact your plan manager or support coordinator for funding questions."
    );
  }

  return lines.join(" ");
}
