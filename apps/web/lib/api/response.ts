import { ZodError } from "zod";

/** Narrow auth-handler results (`CurrentUser | Response`) without instanceof sprawl. */
export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}

export function jsonOk<T>(data: T, status = 200) {
  return Response.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function zodErrorResponse(error: ZodError) {
  return Response.json(
    {
      error: "Validation failed",
      details: error.flatten(),
    },
    { status: 400 }
  );
}
