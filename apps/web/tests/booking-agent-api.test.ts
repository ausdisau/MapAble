import { describe, expect, it } from "vitest";

import {
  DISABILITY_AGENT_OPERATIONS,
  disabilityAgentJsonError,
} from "@/lib/api/disability-agent-api-contract";

describe("booking agent API contract", () => {
  it("exposes stable booking operationIds", () => {
    expect(DISABILITY_AGENT_OPERATIONS.bookingServicesAgentTurn).toBe(
      "bookingServicesAgentTurn",
    );
    expect(DISABILITY_AGENT_OPERATIONS.searchBookings).toBe("searchBookings");
  });

  it("returns X-Operation-Id on booking agent errors", async () => {
    const res = disabilityAgentJsonError(
      DISABILITY_AGENT_OPERATIONS.bookingServicesAgentTurn,
      401,
      {
        error: "Sign in required.",
        code: "AUTH_REQUIRED",
        retryable: false,
      },
    );

    expect(res.headers.get("X-Operation-Id")).toBe("bookingServicesAgentTurn");
    const body = (await res.json()) as { operationId: string; code: string };
    expect(body.operationId).toBe("bookingServicesAgentTurn");
    expect(body.code).toBe("AUTH_REQUIRED");
  });

  it("returns X-Operation-Id on searchBookings errors", async () => {
    const res = disabilityAgentJsonError(
      DISABILITY_AGENT_OPERATIONS.searchBookings,
      400,
      {
        error: "Invalid request",
        code: "VALIDATION_ERROR",
        retryable: false,
      },
    );

    expect(res.headers.get("X-Operation-Id")).toBe("searchBookings");
    const body = (await res.json()) as { operationId: string };
    expect(body.operationId).toBe("searchBookings");
  });
});
