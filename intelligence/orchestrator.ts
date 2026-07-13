import { Agent, run } from "@openai/agents";
import { z } from "zod";

import { createAgentRun } from "@/lib/agent-ops/agent-run-service";

import {
  accessAgent,
  careAgent,
  foodsAgent,
  jobsAgent,
  movesAgent,
  paymentsAgent,
  transportAgent,
} from "./agents";
import type {
  JourneyNarrative,
  MapAbleIntelligenceContext,
  TransportOption,
} from "./types";

const narrativeOutput = z.object({
  summary: z.string(),
  reasoning: z.string(),
  uncertainty: z.array(z.string()),
  selectedOptionId: z.string().nullable(),
});

export const mapAbleOrchestrator = new Agent({
  name: "MapAble Intelligence Fabric",
  instructions: `
You are the single participant-facing manager agent for MapAble.
Use specialist agents for domain analysis, but keep responsibility for the final answer.
Explain important recommendations in plain, respectful language.
Clearly state uncertainty and evidence limitations.
Never perform a booking, payment, application, roster change, disclosure, eligibility
decision, clinical decision, emotion recognition, disability scoring, or employment rejection.
Consequential actions require an explicit human approval workflow outside the model.
Return only the requested structured output.
  `.trim(),
  outputType: narrativeOutput,
  tools: [
    careAgent.asTool({
      toolName: "consult_care_specialist",
      toolDescription: "Analyse care and support coordination considerations.",
    }),
    transportAgent.asTool({
      toolName: "consult_transport_specialist",
      toolDescription: "Analyse accessible journey and transport considerations.",
    }),
    jobsAgent.asTool({
      toolName: "consult_jobs_specialist",
      toolDescription: "Analyse inclusive employment considerations.",
    }),
    accessAgent.asTool({
      toolName: "consult_access_specialist",
      toolDescription: "Analyse venue and physical accessibility evidence.",
    }),
    movesAgent.asTool({
      toolName: "consult_moves_specialist",
      toolDescription: "Analyse rehabilitation coordination considerations.",
    }),
    foodsAgent.asTool({
      toolName: "consult_foods_specialist",
      toolDescription: "Analyse accessible food and delivery considerations.",
    }),
    paymentsAgent.asTool({
      toolName: "consult_payments_specialist",
      toolDescription: "Explain budgets, invoices and payment evidence without transacting.",
    }),
  ],
});

function deterministicNarrative(
  context: MapAbleIntelligenceContext,
  options: TransportOption[]
): JourneyNarrative {
  const selected = options[0] ?? null;
  const appointment = context.selectedAppointment;
  const summary = selected
    ? `${selected.label} is the leading draft option${appointment ? ` for ${appointment.title}` : ""}. Nothing has been booked.`
    : "MapAble needs more journey information before it can suggest a safe option.";

  return {
    summary,
    reasoning: selected
      ? selected.rationale
      : "No option can be ranked until the appointment and journey details are available.",
    uncertainty: [
      "Live vehicle and provider availability has not been checked.",
      "Travel time is advisory until origin, destination and live conditions are confirmed.",
    ],
    selectedOptionId: selected?.id ?? null,
  };
}

export async function explainJourneyPlan(params: {
  context: MapAbleIntelligenceContext;
  options: TransportOption[];
  message: string;
}): Promise<JourneyNarrative> {
  const fallback = deterministicNarrative(params.context, params.options);
  if (!process.env.OPENAI_API_KEY || process.env.MAPABLE_AI_ENABLED === "false") {
    return fallback;
  }

  const input = JSON.stringify({
    participantRequest: params.message,
    appointment: params.context.selectedAppointment,
    mobilityRequirements: params.context.mobilityRequirements,
    accessNotes: params.context.accessNotes,
    options: params.options,
    instruction:
      "Ask the transport specialist to assess the options, then produce a concise participant-facing recommendation. Do not claim live availability and do not book anything.",
  });

  try {
    const result = await run(mapAbleOrchestrator, input);
    return narrativeOutput.parse(result.finalOutput);
  } catch (error) {
    console.error("[mapable-intelligence-orchestrator]", error);
    return fallback;
  }
}

export async function recordJourneyAgentRun(params: {
  participantId: string;
  actorUserId: string;
  requestId: string;
  toolsCalled: string[];
  optionCount: number;
}) {
  return createAgentRun({
    agentType: "transport",
    participantId: params.participantId,
    actorUserId: params.actorUserId,
    inputSummary: { requestId: params.requestId },
    outputSummary: { optionCount: params.optionCount },
    toolsCalled: params.toolsCalled,
    riskTier: "medium",
    humanReviewRequired: false,
    participantConfirmationRequired: true,
  });
}
