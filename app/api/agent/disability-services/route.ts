import { z } from "zod";

import { runDisabilityServicesAgentTurn } from "@/lib/agent/disability-services-agent";
import { createAgentRun } from "@/lib/ai/agent-ops/agent-run-service";
import {
  DISABILITY_AGENT_OPERATIONS,
  disabilityAgentJsonError,
  disabilityAgentJsonOk,
} from "@/lib/api/disability-agent-api-contract";
import { checkIpRateLimit, getClientIp } from "@/lib/api/ip-rate-limit";
import { isDisabilityServicesAgentConfigured } from "@/lib/config/disability-services-agent";

const OPERATION = DISABILITY_AGENT_OPERATIONS.disabilityServicesAgentTurn;

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

  if (!isDisabilityServicesAgentConfigured()) {
    return disabilityAgentJsonError(OPERATION, 503, {
      error:
        "Disability services agent is not enabled. Set DISABILITY_SERVICES_AGENT_ENABLED=true.",
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
    const result = await runDisabilityServicesAgentTurn(parsed.data);

    void createAgentRun({
      agentType: "matching",
      inputSummary: { query: parsed.data.query.slice(0, 500) },
      outputSummary: {
        toolsCalled: result.toolsCalled,
        textLength: result.text.length,
      },
      toolsCalled: result.toolsCalled,
      riskTier: "low",
      humanReviewRequired: false,
    });

    return disabilityAgentJsonOk(OPERATION, {
      answer: result.text,
      toolsCalled: result.toolsCalled,
      sessionId: result.sessionId,
      operationId: OPERATION,
    });
  } catch (err) {
    console.error("[disability-services-agent]", err);
    return disabilityAgentJsonError(OPERATION, 502, {
      error: "Agent turn failed.",
      code: "UPSTREAM_ERROR",
      retryable: true,
    });
  }
}
