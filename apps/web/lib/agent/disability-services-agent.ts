import { ToolLoopAgent, stepCountIs } from "ai";

import { createDisabilityServicesTools } from "@/lib/agent/disability-services-tools";
import { assertModelCallAllowed } from "@/lib/ai/platform/policies/kill-switches";
import {
  createHarnessSession,
  isAuraHarnessEnabled,
  wrapToolsWithAuraHarness,
  type HarnessSessionAccumulator,
  type HarnessSessionSummary,
} from "@/lib/aura-harness";
import { isAiPlatformFoundationEnabled } from "@/lib/config/ai-platform";
import {
  disabilityServicesAgentConfig,
  isDisabilityServicesAgentConfigured,
} from "@/lib/config/disability-services-agent";
import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";
import { getInterpreterModel } from "@/lib/search/interpreter/get-model";

const SYSTEM_INSTRUCTIONS = `You are MapAble's Agentic Disability Services assistant for the Australian NDIS.

Help participants, families, and support coordinators find NDIS-registered providers and understand access needs.

Rules:
- Use interpretFinderQuery first when the user describes what they need in natural language.
- Use searchNdisProviders to return real directory listings — never invent provider names.
- Use geocodeLocation when the user mentions a suburb, city, or postcode and coordinates would help.
- Use explainProvider when the user asks about a specific provider by name.
- Be concise, plain-language, and trauma-informed. Prefer Australian English and NDIS terminology.
- If results are empty, suggest broader search terms or a nearby suburb.
- Do not provide medical, legal, or plan-management advice — signpost to qualified professionals.`;

const CAPABILITY_KEY = "agent.disability_services";

export function createDisabilityServicesAgent(
  session: HarnessSessionAccumulator = createHarnessSession(),
) {
  if (!isDisabilityServicesAgentConfigured()) {
    throw new Error("Disability services agent is not enabled");
  }
  if (!isSearchInterpreterConfigured()) {
    throw new Error("Search interpreter is not configured");
  }

  if (isAiPlatformFoundationEnabled()) {
    const gate = assertModelCallAllowed({ capabilityKey: CAPABILITY_KEY });
    if (!gate.allowed) {
      throw new Error(`Disability services agent blocked: ${gate.reason}`);
    }
  }

  const tools = wrapToolsWithAuraHarness(createDisabilityServicesTools(), {
    agentType: "matching",
    capabilityKey: CAPABILITY_KEY,
    session,
  });

  return new ToolLoopAgent({
    model: getInterpreterModel(),
    instructions: SYSTEM_INSTRUCTIONS,
    tools,
    stopWhen: stepCountIs(disabilityServicesAgentConfig.maxSteps),
  });
}

export type DisabilityServicesAgentTurnInput = {
  query: string;
  sessionId?: string;
};

export type DisabilityServicesAgentTurnResult = {
  text: string;
  toolsCalled: string[];
  sessionId: string;
  aura?: HarnessSessionSummary;
  auraEnabled: boolean;
  riskTier: "low" | "medium" | "high" | "critical";
  humanReviewRequired: boolean;
};

export async function runDisabilityServicesAgentTurn(
  input: DisabilityServicesAgentTurnInput,
): Promise<DisabilityServicesAgentTurnResult> {
  const harnessSession = createHarnessSession();
  const agent = createDisabilityServicesAgent(harnessSession);
  const sessionId = input.sessionId?.trim() || `agent-${Date.now()}`;

  const result = await agent.generate({
    prompt: input.query.trim(),
  });

  const toolsCalled = result.steps.flatMap((step) =>
    step.toolCalls.map((call) => call.toolName),
  );

  const auraEnabled = isAuraHarnessEnabled();
  return {
    text: result.text,
    toolsCalled,
    sessionId,
    aura: auraEnabled ? harnessSession.summary : undefined,
    auraEnabled,
    riskTier: auraEnabled ? harnessSession.toRiskTier() : "low",
    humanReviewRequired: auraEnabled
      ? harnessSession.humanReviewRequired()
      : false,
  };
}
