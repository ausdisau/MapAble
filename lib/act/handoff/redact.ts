const SENSITIVE_KEY =
  /password|secret|token|ndis|ssn|medicare|card|cvv|authorization/i;

/** Shallow redaction of tool payloads before persisting handoffs. */
export function redactHandoffPayload(payload: unknown): Record<string, unknown> {
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
    return { value: payload == null ? null : "[REDACTED_NON_OBJECT]" };
  }

  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
    if (SENSITIVE_KEY.test(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    if (typeof value === "string" && value.length > 500) {
      out[key] = `${value.slice(0, 500)}…`;
      continue;
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = redactHandoffPayload(value);
      continue;
    }
    out[key] = value;
  }
  return out;
}
