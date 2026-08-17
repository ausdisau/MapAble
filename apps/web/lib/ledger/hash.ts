import { createHash } from "crypto";

export function sha256Hex(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function hashPayload(payload: Record<string, unknown>): string {
  return sha256Hex(JSON.stringify(canonicalize(payload)));
}

function canonicalize(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = canonicalize(obj[key]);
  }
  return sorted;
}

export function chainEventHash(
  previousEventHash: string | null,
  payloadHash: string,
  meta: { type: string; subjectRef: string; createdAt: string }
): string {
  return sha256Hex(
    JSON.stringify({
      previous: previousEventHash ?? "genesis",
      payloadHash,
      ...meta,
    })
  );
}
