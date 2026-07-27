import { ToolLoopAgent, stepCountIs } from "ai";

import { resolveModelForCapability } from "@/lib/ai/platform/models/gateway";
import { assertModelCallAllowed } from "@/lib/ai/platform/policies/kill-switches";
import { getPrompt } from "@/lib/ai/platform/prompts/registry";
import { isAiPlatformFoundationEnabled } from "@/lib/config/ai-platform";
import {
  isUnderstandingEnabled,
  understandingConfig,
} from "@/lib/config/understanding";
import { ensureUnderstandingRecogniseBridge } from "@/lib/understanding/recognise-bridge";
import { createUnderstandingTools } from "@/lib/understanding/understanding-tools";

export const UNDERSTANDING_CAPABILITY_KEY = "understanding.contextual";

function systemInstructions(): string {
  const registered = getPrompt("understanding.dda_ndis_context");
  if (registered?.systemInstructions) return registered.systemInstructions;
  return `You are MapAble Understanding — interpret participant context through DDA accessibility duties and NDIS funding-rule constraints as context only. Never invent diagnoses, never determine SDA/SIL eligibility, never override plan managers. Prefer tools for facts.`;
}

export function createUnderstandingAgent(participantId: string) {
  if (!isUnderstandingEnabled()) {
    throw new Error("UNDERSTANDING_DISABLED");
  }

  if (isAiPlatformFoundationEnabled()) {
    const gate = assertModelCallAllowed({
      capabilityKey: UNDERSTANDING_CAPABILITY_KEY,
    });
    if (!gate.allowed) {
      throw new Error(`Understanding agent blocked: ${gate.reason}`);
    }
  }

  ensureUnderstandingRecogniseBridge();

  const resolved = resolveModelForCapability({
    capabilityKey: UNDERSTANDING_CAPABILITY_KEY,
  });
  if (!resolved.ok) {
    throw new Error(`Understanding model unavailable: ${resolved.reason}`);
  }

  return new ToolLoopAgent({
    model: resolved.model,
    instructions: systemInstructions(),
    tools: createUnderstandingTools(participantId),
    stopWhen: stepCountIs(understandingConfig.maxSteps),
  });
}

export type UnderstandingAgentTurnInput = {
  query: string;
  participantId: string;
  sessionId?: string;
};

export type UnderstandingAgentTurnResult = {
  text: string;
  toolsCalled: string[];
  sessionId: string;
  participantId: string;
};

export async function runUnderstandingAgentTurn(
  input: UnderstandingAgentTurnInput,
): Promise<UnderstandingAgentTurnResult> {
  const agent = createUnderstandingAgent(input.participantId);
  const sessionId = input.sessionId?.trim() || `understanding-${Date.now()}`;
  const result = await agent.generate({
    prompt: input.query.trim(),
  });
  const toolsCalled = result.steps.flatMap((step) =>
    step.toolCalls.map((call) => call.toolName),
  );
  return {
    text: result.text,
    toolsCalled,
    sessionId,
    participantId: input.participantId,
  };
}
