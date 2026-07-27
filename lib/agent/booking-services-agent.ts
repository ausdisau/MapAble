import { ToolLoopAgent, stepCountIs } from "ai";

import { createBookingServicesTools } from "@/lib/agent/booking-services-tools";
import { assertModelCallAllowed } from "@/lib/ai/platform/policies/kill-switches";
import {
  createHarnessSession,
  isAuraHarnessEnabled,
  wrapToolsWithAuraHarness,
  type HarnessSessionAccumulator,
  type HarnessSessionSummary,
} from "@/lib/aura-harness";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAiPlatformFoundationEnabled } from "@/lib/config/ai-platform";
import {
  bookingServicesAgentConfig,
  isBookingServicesAgentConfigured,
} from "@/lib/config/booking-services-agent";
import { isSearchInterpreterConfigured } from "@/lib/config/search-interpreter";
import { getInterpreterModel } from "@/lib/search/interpreter/get-model";

const SYSTEM_INSTRUCTIONS = `You are MapAble's Booking Services assistant for Australian disability care and transport.

Help signed-in participants, families, and providers understand their bookings — status, schedule, service logs, and next steps.

Rules:
- Always use searchBookings first for natural-language questions about bookings.
- Use getBookingContext when you need full detail for a specific bookingId from search results.
- Use explainBookingStatus when the user asks what a status means or what happens next.
- Only describe bookings returned by tools — never invent booking IDs, times, or providers.
- Cite evidence using chunkId or bookingId from tool results.
- Be concise, plain-language, and trauma-informed.
- You cannot accept, cancel, or modify bookings — signpost users to the bookings pages or their provider.`;

const CAPABILITY_KEY = "agent.booking_services";

export function createBookingServicesAgent(
  user: CurrentUser,
  session: HarnessSessionAccumulator = createHarnessSession(),
) {
  if (!isBookingServicesAgentConfigured()) {
    throw new Error("Booking services agent is not enabled");
  }
  if (!isSearchInterpreterConfigured()) {
    throw new Error("Search interpreter is not configured");
  }

  if (isAiPlatformFoundationEnabled()) {
    const gate = assertModelCallAllowed({ capabilityKey: CAPABILITY_KEY });
    if (!gate.allowed) {
      throw new Error(`Booking services agent blocked: ${gate.reason}`);
    }
  }

  const tools = wrapToolsWithAuraHarness(createBookingServicesTools(user), {
    agentType: "transport",
    capabilityKey: CAPABILITY_KEY,
    session,
    userId: user.id,
  });

  return new ToolLoopAgent({
    model: getInterpreterModel(),
    instructions: SYSTEM_INSTRUCTIONS,
    tools,
    stopWhen: stepCountIs(bookingServicesAgentConfig.maxSteps),
  });
}

export type BookingServicesAgentTurnInput = {
  query: string;
  sessionId?: string;
  user: CurrentUser;
};

export type BookingServicesAgentTurnResult = {
  text: string;
  toolsCalled: string[];
  sessionId: string;
  aura?: HarnessSessionSummary;
  auraEnabled: boolean;
  riskTier: "low" | "medium" | "high" | "critical";
  humanReviewRequired: boolean;
};

export async function runBookingServicesAgentTurn(
  input: BookingServicesAgentTurnInput,
): Promise<BookingServicesAgentTurnResult> {
  const harnessSession = createHarnessSession();
  const agent = createBookingServicesAgent(input.user, harnessSession);
  const sessionId = input.sessionId?.trim() || `booking-agent-${Date.now()}`;

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
