import { ZodError } from "zod";

import { zodErrorResponse } from "@/lib/api/response";
import { TransportApiError, transportErrorResponse } from "@/lib/transport/transport-api-error";

export function handleTransportRouteError(e: unknown) {
  if (e instanceof TransportApiError) return transportErrorResponse(e);
  if (e instanceof ZodError) return zodErrorResponse(e);
  if (e instanceof Error && e.message === "CONSENT_REQUIRED") {
    return transportErrorResponse(
      new TransportApiError("TRANSPORT_CONSENT_REQUIRED")
    );
  }
  console.error(e);
  return Response.json(
    { error: "Something went wrong. Please try again.", code: "TRANSPORT_VALIDATION_FAILED" },
    { status: 500 }
  );
}
