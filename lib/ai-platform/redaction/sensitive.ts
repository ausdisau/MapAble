const PATTERNS: RegExp[] = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, // card-like
  /\b(?:sk|pk|rk)[-_][A-Za-z0-9]{16,}\b/g,
  /\bpassword\s*[:=]\s*\S+/gi,
];

/** Redact obvious secrets before model input. Does not remove all PII. */
export function redactSensitiveText(input: string): string {
  let out = input;
  for (const pattern of PATTERNS) {
    out = out.replace(pattern, "[REDACTED]");
  }
  return out;
}
