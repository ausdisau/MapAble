/**
 * Safe request correlation identifiers for logs and response headers.
 * Never embed participant free text or secrets.
 */

export const CORRELATION_ID_HEADER = "x-correlation-id";
export const REQUEST_ID_HEADER = "x-request-id";

export type SafeErrorClass =
  | "auth_failure"
  | "validation"
  | "not_found"
  | "rate_limited"
  | "dependency_unavailable"
  | "misconfiguration"
  | "forbidden"
  | "internal";

export function createCorrelationId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `corr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function resolveCorrelationId(
  incoming: string | null | undefined,
): string {
  const trimmed = incoming?.trim();
  if (trimmed && /^[\w.-]{8,128}$/.test(trimmed)) return trimmed;
  return createCorrelationId();
}

/** Map thrown errors to a coarse class without leaking messages upstream. */
export function classifySafeError(error: unknown): SafeErrorClass {
  if (!error || typeof error !== "object") return "internal";
  const status =
    "status" in error && typeof error.status === "number"
      ? error.status
      : undefined;
  const name = "name" in error ? String(error.name) : "";
  if (status === 401 || /auth/i.test(name)) return "auth_failure";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status === 429) return "rate_limited";
  if (status === 400 || /validation|zod|invariant/i.test(name)) {
    return "validation";
  }
  if (status === 503 || /unavailable|timeout|encrypt/i.test(name)) {
    return "dependency_unavailable";
  }
  if (/misconfig|secret|env/i.test(name)) return "misconfiguration";
  return "internal";
}
