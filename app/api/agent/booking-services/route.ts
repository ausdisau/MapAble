import { z } from "zod";

import { runBookingServicesAgentTurn } from "@/lib/agent/booking-services-agent";
import { createAgentRun } from "@/lib/ai/agent-ops/agent-run-service";
import { requireApiSession } from "@/lib/api/auth-handler";
import {
  DISABILITY_AGENT_OPERATIONS,
  disabilityAgentJsonError,
  disabilityAgentJsonOk,
} from "@/lib/api/disability-agent-api-contract";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { isBookingServicesAgentConfigured } from "@/lib/config/booking-services-agent";

const OPERATION = DISABILITY_AGENT_OPERATIONS.bookingServicesAgentTurn;

const requestSchema = z.object({
  query: z.string().min(1).max(2000),
  sessionId: z.string().max(128).optional(),
});

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

export async function POST(request: Request) {
  const ip = getClientIp(request);

  if (
    !checkIpRateLimit(ip, {
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
    })
  ) {
    return disabilityAgentJsonError(OPERATION, 429, {
      error: "Too many requests. Please wait a moment.",
      code: "RATE_LIMITED",
      retryable: true,
    });
  }

  const user = await requireApiSession();
  if (user instanceof Response) {
    return disabilityAgentJsonError(OPERATION, 401, {
      error: "Sign in required.",
      code: "AUTH_REQUIRED",
      retryable: false,
    });
  }

  if (!isBookingServicesAgentConfigured()) {
    return disabilityAgentJsonError(OPERATION, 503, {
      error:
        "Booking services agent is not enabled. Set BOOKING_SERVICES_AGENT_ENABLED=true.",
      code: "NOT_CONFIGURED",
      retryable: false,
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return disabilityAgentJsonError(OPERATION, 400, {
      error: "Invalid JSON body",
      code: "VALIDATION_ERROR",
      retryable: false,
    });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return disabilityAgentJsonError(OPERATION, 400, {
      error: "Invalid request",
      code: "VALIDATION_ERROR",
      details: parsed.error.flatten(),
      retryable: false,
    });
  }

  try {
    const result = await runBookingServicesAgentTurn({
      query: parsed.data.query,
      sessionId: parsed.data.sessionId,
      user,
    });

    void createAgentRun({
      agentType: "transport",
      participantId: user.id,
      inputSummary: { query: parsed.data.query.slice(0, 500) },
      outputSummary: {
        toolsCalled: result.toolsCalled,
        textLength: result.text.length,
      },
      toolsCalled: result.toolsCalled,
      riskTier: "low",
      humanReviewRequired: false,
      actorUserId: user.id,
    });

    return disabilityAgentJsonOk(OPERATION, {
      operationId: OPERATION,
      text: result.text,
      toolsCalled: result.toolsCalled,
      sessionId: result.sessionId,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Booking agent failed";
    return disabilityAgentJsonError(OPERATION, 500, {
      error: message,
      code: "UPSTREAM_ERROR",
      retryable: true,
    });
  }
}
