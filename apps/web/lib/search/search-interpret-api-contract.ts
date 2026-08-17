export const SEARCH_INTERPRET_OPERATIONS = {
  interpretQuery: "searchInterpretQuery",
} as const;

export type SearchInterpretOperationId =
  (typeof SEARCH_INTERPRET_OPERATIONS)[keyof typeof SEARCH_INTERPRET_OPERATIONS];

export type SearchInterpretErrorCode =
  | "SEARCH_INTERPRET_NOT_CONFIGURED"
  | "SEARCH_INTERPRET_VALIDATION_ERROR"
  | "SEARCH_INTERPRET_UPSTREAM_ERROR"
  | "RATE_LIMITED";

export type SearchInterpretErrorBody = {
  error: string;
  code: SearchInterpretErrorCode;
  operationId: SearchInterpretOperationId;
  details?: unknown;
  retryable?: boolean;
};

export function searchInterpretJsonError(
  operationId: SearchInterpretOperationId,
  status: number,
  body: Omit<SearchInterpretErrorBody, "operationId">,
): Response {
  return Response.json(
    {
      operationId,
      retryable: body.retryable ?? status >= 500,
      ...body,
    } satisfies SearchInterpretErrorBody,
    {
      status,
      headers: { "X-Operation-Id": operationId },
    },
  );
}

export function searchInterpretJsonOk<T>(
  operationId: SearchInterpretOperationId,
  body: T,
): Response {
  return Response.json(body, {
    headers: { "X-Operation-Id": operationId },
  });
}
