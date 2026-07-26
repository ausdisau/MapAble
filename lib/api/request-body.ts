import { readTextWithByteLimit } from "@/lib/access/import/read-limited-body";

/** Max JSON body for authenticated access API writes (suggest place, reviews). */
export const ACCESS_API_MAX_JSON_BYTES = 256 * 1024;

export async function parseJsonRequestBody(
  req: Request,
  maxBytes: number = ACCESS_API_MAX_JSON_BYTES
): Promise<unknown> {
  const raw = await readTextWithByteLimit(req, maxBytes);
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

export function jsonBodyErrorResponse(error: unknown) {
  const msg = error instanceof Error ? error.message : "";
  if (msg === "BODY_TOO_LARGE") {
    return { status: 413 as const, message: "Request body too large" };
  }
  if (msg === "CONTENT_LENGTH_REQUIRED") {
    return { status: 411 as const, message: "Content-Length required" };
  }
  if (msg === "INVALID_JSON") {
    return { status: 400 as const, message: "Invalid JSON body" };
  }
  return { status: 400 as const, message: "Invalid JSON body" };
}
