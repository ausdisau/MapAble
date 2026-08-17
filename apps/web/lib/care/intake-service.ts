import type { CareRequestType } from "@prisma/client";

import { runCareGuardrailAgent } from "@/server/agents/care/careGuardrailAgent";
import { runCareIntakeAgent } from "@/server/agents/care/careIntakeAgent";
import type {
  CareIntakeResult,
  CarePlanDraft,
  CareSupportTransformInput,
} from "@/server/agents/care/types";

import { classifySupportCategories } from "./support-category-classifier";

export type IntakePipelineResult = {
  intake: CareIntakeResult;
  carePlanDraft: CarePlanDraft;
  categorySuggestions: ReturnType<typeof classifySupportCategories>;
  guardrailTriggers: string[];
  humanReviewRequired: boolean;
};

export async function runIntakePipeline(
  input: CareSupportTransformInput
): Promise<IntakePipelineResult> {
  const intake = await runCareIntakeAgent(input);

  const carePlanDraft: CarePlanDraft = {
    status: "needs_confirmation",
    bookingStatus: "blocked_until_participant_confirmation",
    requestType: intake.inferredRequestType,
    title: intake.titleHint,
    description: intake.normalizedMessage,
    preferredDate: intake.schedulingHints.preferredDate,
    startTime: intake.schedulingHints.startTime,
    endTime: intake.schedulingHints.endTime,
    address: intake.schedulingHints.locationHint,
    linkedTransportRequired: intake.linkedTransportRequired,
    shareAccessibility: false,
    shareAccessibilityConfirmed: false,
    tasks: [],
    autoAssignWorkers: false,
    autoFinalizeBooking: false,
  };

  const guardrail = await runCareGuardrailAgent({
    intake,
    carePlanDraft,
    requiredCapabilities: [],
    participantId: input.participantId,
    preferences: input.preferences,
    sessionOnly: !input.participantId,
  });

  const categorySuggestions = classifySupportCategories({
    message: input.message,
    requestType: intake.inferredRequestType as CareRequestType,
    taskNames: carePlanDraft.tasks.map((t) => t.name),
  });

  return {
    intake,
    carePlanDraft: guardrail.carePlanDraft,
    categorySuggestions,
    guardrailTriggers: guardrail.auditTriggers,
    humanReviewRequired: guardrail.guardrailDecision.humanReviewRequired,
  };
}
