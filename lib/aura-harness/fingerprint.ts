import { createHash } from "crypto";

/** Stable JSON stringify with sorted object keys. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      sorted[key] = sortKeys(obj[key]);
    }
    return sorted;
  }
  return value;
}

export function fingerprintToolCall(toolName: string, args: unknown): string {
  const payload = `${toolName}\n${canonicalJson(args ?? null)}`;
  return createHash("sha256").update(payload).digest("hex");
}
