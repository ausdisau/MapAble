const SENSITIVE_KEYS = [
  "password",
  "ndis",
  "clinical",
  "incidentNarrative",
  "consent",
  "payment",
];

export function redactAutomationPayload(
  payload: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))) {
      out[key] = "[redacted]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      out[key] = redactAutomationPayload(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}

export async function publishLowRiskEvent(
  eventKey: string,
  payload: Record<string, unknown>
) {
  const { deliverN8nEvent } = await import(
    "@/lib/automation/n8n/n8n-webhook-service"
  );
  return deliverN8nEvent(eventKey, payload);
}
