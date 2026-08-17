/** Agent-ready response helpers for disability services APIs. */

export const DISABILITY_AGENT_OPERATIONS = {
  searchInterpretQuery: "searchInterpretQuery",
  mapableAskQuery: "mapableAskQuery",
  ndisProviderSearch: "ndisProviderSearch",
  disabilityServicesAgentTurn: "disabilityServicesAgentTurn",
  bookingServicesAgentTurn: "bookingServicesAgentTurn",
  searchBookings: "searchBookings",
} as const;

export type DisabilityAgentOperationId =
  (typeof DISABILITY_AGENT_OPERATIONS)[keyof typeof DISABILITY_AGENT_OPERATIONS];

export type DisabilityAgentErrorCode =
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "NOT_CONFIGURED"
  | "UPSTREAM_ERROR";

export type DisabilityAgentErrorBody = {
  error: string;
  code: DisabilityAgentErrorCode;
  operationId: DisabilityAgentOperationId;
  details?: unknown;
  retryable?: boolean;
};

export function disabilityAgentJsonError(
  operationId: DisabilityAgentOperationId,
  status: number,
  body: Omit<DisabilityAgentErrorBody, "operationId">,
): Response {
  return Response.json(
    {
      operationId,
      retryable: body.retryable ?? status >= 500,
      ...body,
    } satisfies DisabilityAgentErrorBody,
    {
      status,
      headers: { "X-Operation-Id": operationId },
    },
  );
}

export function disabilityAgentJsonOk<T>(
  operationId: DisabilityAgentOperationId,
  body: T,
  init?: { status?: number },
): Response {
  return Response.json(body, {
    status: init?.status ?? 200,
    headers: { "X-Operation-Id": operationId },
  });
}
