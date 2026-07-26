import { randomUUID } from "crypto";

export type IndoorApiErrorCode =
  | "INDOOR_FEATURE_DISABLED"
  | "FLOOR_PLAN_NOT_FOUND"
  | "FLOOR_PLAN_FORBIDDEN"
  | "FLOOR_PLAN_VALIDATION_FAILED"
  | "FLOOR_PLAN_INVALID_TRANSITION"
  | "FLOOR_PLAN_VERSION_CONFLICT"
  | "CORRECTION_NOT_FOUND"
  | "ROUTE_NOT_FOUND"
  | "ROUTE_UNAVAILABLE"
  | "CHECKPOINT_INVALID"
  | "CHECKPOINT_REVOKED"
  | "SHARE_LINK_INVALID"
  | "SHARE_LINK_REVOKED"
  | "SHARE_LINK_EXPIRED"
  | "PARTNER_SCOPE_DENIED"
  | "PARTNER_RATE_LIMITED"
  | "VENUE_NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN";

export type IndoorApiErrorBody = {
  error: {
    code: IndoorApiErrorCode;
    message: string;
    fieldErrors?: Record<string, string[]>;
    requestId: string;
  };
};

export function indoorApiError(
  code: IndoorApiErrorCode,
  message: string,
  status = 400,
  fieldErrors?: Record<string, string[]>,
): Response {
  const body: IndoorApiErrorBody = {
    error: {
      code,
      message,
      fieldErrors,
      requestId: randomUUID(),
    },
  };
  return Response.json(body, { status });
}

export function featureDisabledResponse(feature: string): Response {
  return indoorApiError(
    "INDOOR_FEATURE_DISABLED",
    `The requested capability (${feature}) is not enabled.`,
    503,
  );
}
