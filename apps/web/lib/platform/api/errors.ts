export type ApiErrorCode =
  | "unauthorized"
  | "forbidden"
  | "not_found"
  | "validation_error"
  | "rate_limited"
  | "platform_disabled"
  | "scope_denied"
  | "participant_authority_required";

export type StructuredApiError = {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
};

export function apiErrorResponse(
  code: ApiErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>,
) {
  const body: StructuredApiError = {
    error: { code, message, ...(details ? { details } : {}) },
  };
  return Response.json(body, { status });
}

export function apiSuccessResponse<T>(
  data: T,
  status = 200,
  headers?: Record<string, string>,
) {
  const response = Response.json({ data }, { status });
  if (headers) {
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  }
  return response;
}
