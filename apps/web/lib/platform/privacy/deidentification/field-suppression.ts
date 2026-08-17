/** Fields that must never appear in analytics or research exports. */
export const ALWAYS_SUPPRESSED_FIELDS = [
  "name",
  "email",
  "phone",
  "address",
  "homeAddress",
  "clinicalNotes",
  "safeguardingNarrative",
  "ndisNumber",
  "dateOfBirth",
  "medicareNumber",
] as const;

export type SuppressionResult = {
  record: Record<string, unknown>;
  suppressedFields: string[];
};

export function suppressSensitiveFields(
  record: Record<string, unknown>,
  extraSuppress?: string[],
): SuppressionResult {
  const suppressedFields: string[] = [];
  const blocked = new Set<string>([
    ...ALWAYS_SUPPRESSED_FIELDS,
    ...(extraSuppress ?? []),
  ]);

  const recordCopy: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (blocked.has(key)) {
      suppressedFields.push(key);
      continue;
    }
    recordCopy[key] = value;
  }

  return { record: recordCopy, suppressedFields };
}
