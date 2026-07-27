const SENSITIVE_KEY = /api[_-]?key|password|secret|token|authorization|card|cvv|health|diagnos|symptom/i;

export function redactCareOSValue(value: unknown, key = ""): unknown {
  if (SENSITIVE_KEY.test(key)) return "[REDACTED]";
  if (Array.isArray(value)) return value.map((item) => redactCareOSValue(item));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [
        childKey,
        redactCareOSValue(childValue, childKey),
      ])
    );
  }
  if (typeof value === "string" && value.length > 500) return "[OMITTED]";
  return value;
}

export function redactCareOSMetadata(
  metadata: Record<string, unknown>
): Record<string, unknown> {
  return redactCareOSValue(metadata) as Record<string, unknown>;
}
