import { isCapabilityPassportPreviewEnabled } from "@/lib/config/capability-passport";
import { CapabilityPassportAccessError } from "@/lib/workforce/access";

export function notAvailableResponse(): Response {
  return Response.json({ error: "Not available." }, { status: 404 });
}

export function guardCapabilityPassportPreview(): Response | null {
  if (!isCapabilityPassportPreviewEnabled()) return notAvailableResponse();
  return null;
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export function jsonPrivate(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function handleCapabilityError(error: unknown): Response {
  if (error instanceof CapabilityPassportAccessError) {
    return jsonPrivate({ error: error.message }, error.status);
  }
  const message = error instanceof Error ? error.message : "REQUEST_FAILED";
  const known: Record<string, number> = {
    WORKFORCE_PASSPORT_DISABLED: 403,
    AUTO_VERIFY_COMPETENCY_FORBIDDEN: 403,
    ACADEMY_ENROLLMENT_NOT_FOUND: 400,
    ENROLLED_NOT_COMPLETED: 400,
    IDENTITY_NOT_BOUND: 400,
    IDENTITY_MISMATCH: 403,
    ORG_WORKER_MISMATCH: 403,
    TRAINING_COMPLETION_NOT_FOUND: 400,
    PROPOSAL_NOT_FOUND: 404,
    PROPOSAL_NOT_PENDING: 400,
    SELF_APPROVAL_FORBIDDEN: 403,
    LEGAL_PROHIBITION_NOT_OVERRIDABLE: 403,
    ASSESSOR_REQUIRED: 403,
    TRUST_PASSPORT_PILOT_DISABLED: 403,
  };
  return jsonPrivate({ error: message }, known[message] ?? 400);
}

export function sanitiseAuditMetadata(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const blocked = /screening.?number|wwcc|document|clinical|health|ndis.?number|credential.?number/i;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (blocked.test(key)) {
      out[key] = "[REDACTED]";
      continue;
    }
    if (typeof value === "string" && blocked.test(value)) {
      out[key] = "[REDACTED]";
      continue;
    }
    out[key] = value;
  }
  return out;
}
