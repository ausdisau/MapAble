import { BLOCKED_EXPORT_FIELDS } from "@/lib/governance/data/export-policy";

export function deidentifyRecord<T extends Record<string, unknown>>(
  record: T
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (BLOCKED_EXPORT_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
      continue;
    }
    if (key === "name" || key === "email" || key === "phone") {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = value;
  }
  return out;
}
