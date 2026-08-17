import { z } from "zod";

import { requireApiSession } from "@/lib/api/auth-handler";
import {
  DISABILITY_AGENT_OPERATIONS,
  disabilityAgentJsonError,
  disabilityAgentJsonOk,
} from "@/lib/api/disability-agent-api-contract";
import { searchScopedBookings } from "@/lib/bookings/rag/search-service";

const OPERATION = DISABILITY_AGENT_OPERATIONS.searchBookings;

const requestSchema = z.object({
  query: z.string().min(1).max(2000),
  recordType: z.enum(["care", "transport", "bundle"]).optional(),
  status: z.string().optional(),
});

export async function POST(request: Request) {
  const user = await requireApiSession();
  if (user instanceof Response) {
    return disabilityAgentJsonError(OPERATION, 401, {
      error: "Sign in required.",
      code: "AUTH_REQUIRED",
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

  const { hits, totalCandidates } = await searchScopedBookings(
    user,
    parsed.data.query,
    {
      recordType: parsed.data.recordType,
      status: parsed.data.status,
    },
  );

  return disabilityAgentJsonOk(OPERATION, {
    operationId: OPERATION,
    totalCandidates,
    count: hits.length,
    hits,
  });
}
