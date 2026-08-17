import { createHmac, createHash, timingSafeEqual } from "crypto";

export function signWebhookPayload(
  secret: string,
  timestamp: string,
  payload: string,
  version = 1,
): string {
  const signedContent = `${version}.${timestamp}.${payload}`;
  return createHmac("sha256", secret).update(signedContent).digest("hex");
}

export function verifyWebhookSignature(input: {
  secret: string;
  timestamp: string;
  payload: string;
  signature: string;
  version?: number;
  maxAgeSeconds?: number;
}): { valid: boolean; reason?: string } {
  const version = input.version ?? 1;
  const maxAge = input.maxAgeSeconds ?? 300;
  const ts = Number(input.timestamp);
  if (!Number.isFinite(ts)) {
    return { valid: false, reason: "invalid_timestamp" };
  }
  const ageSeconds = Math.abs(Date.now() / 1000 - ts);
  if (ageSeconds > maxAge) {
    return { valid: false, reason: "timestamp_expired" };
  }

  const expected = signWebhookPayload(
    input.secret,
    input.timestamp,
    input.payload,
    version,
  );

  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(input.signature, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { valid: false, reason: "signature_mismatch" };
    }
  } catch {
    return { valid: false, reason: "signature_mismatch" };
  }

  return { valid: true };
}

export function hashPayload(payload: string): string {
  return createHash("sha256").update(payload).digest("hex");
}

export function computeRetryDelayMs(attemptCount: number, baseMs: number): number {
  return baseMs * Math.pow(2, attemptCount);
}
