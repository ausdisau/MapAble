import { z } from "zod";

/** Hard caps for CSP report payload fields (abuse / DoS bound). */
export const CSP_REPORT_MAX_STRING = 2_048;
export const CSP_REPORT_MAX_ARRAY = 20;
export const CSP_REPORT_MAX_OBJECT_KEYS = 40;
export const CSP_REPORT_MAX_DEPTH = 4;

/**
 * Field policy at the untrusted boundary:
 * - Known standard browser fields are accepted (including null/absent/empty
 *   where browsers emit them).
 * - Unknown keys are stripped by Zod object defaults (not `.passthrough()`,
 *   not retained for logging).
 * - Sensitive URI/policy/sample/UA values are accepted for shape validation
 *   then discarded or origin-only redacted before any log path.
 */

const boundedString = z.string().max(CSP_REPORT_MAX_STRING);
const optionalString = z.union([boundedString, z.null()]).optional();
const optionalStatusCode = z
  .union([z.number().int().min(0).max(599), z.null()])
  .optional();
const optionalNonNegativeNumber = z
  .union([z.number().finite().nonnegative(), z.null()])
  .optional();

const dispositionSchema = z.union([
  z.enum(["enforce", "report", "reporting"]),
  z.null(),
]);

/** Directive names/values browsers emit — bounded, no control chars. */
const directiveSchema = z
  .string()
  .max(CSP_REPORT_MAX_STRING)
  .regex(/^[a-z0-9_.:'*\s/-]+$/i, "invalid_directive");

const optionalDirective = z.union([directiveSchema, z.null()]).optional();

/**
 * Legacy `application/csp-report` body fields (CSP Level 2 / browser common set).
 * Unknown keys are stripped — not retained.
 */
const legacyCspReportBody = z
  .object({
    "document-uri": optionalString,
    referrer: optionalString,
    "blocked-uri": optionalString,
    "violated-directive": optionalDirective,
    "effective-directive": optionalDirective,
    "original-policy": optionalString,
    disposition: dispositionSchema.optional(),
    "source-file": optionalString,
    "status-code": optionalStatusCode,
    "line-number": optionalNonNegativeNumber,
    "column-number": optionalNonNegativeNumber,
    "script-sample": optionalString,
  })
  .refine(
    (obj) =>
      Boolean(
        (obj["document-uri"] && obj["document-uri"].length > 0) ||
        (obj["blocked-uri"] && obj["blocked-uri"].length > 0) ||
        (obj["violated-directive"] && obj["violated-directive"].length > 0) ||
        (obj["effective-directive"] && obj["effective-directive"].length > 0),
      ),
    "empty_legacy_report",
  );

/**
 * Reporting API `csp-violation` body (CSP3 / Reporting API).
 * Unknown keys are stripped — not retained.
 */
const reportingApiBody = z
  .object({
    documentURL: optionalString,
    referrer: optionalString,
    blockedURL: optionalString,
    effectiveDirective: optionalDirective,
    violatedDirective: optionalDirective,
    originalPolicy: optionalString,
    disposition: dispositionSchema.optional(),
    sourceFile: optionalString,
    statusCode: optionalStatusCode,
    lineNumber: optionalNonNegativeNumber,
    columnNumber: optionalNonNegativeNumber,
    sample: optionalString,
  })
  .refine(
    (obj) =>
      Boolean(
        (obj.documentURL && obj.documentURL.length > 0) ||
        (obj.blockedURL && obj.blockedURL.length > 0) ||
        (obj.effectiveDirective && obj.effectiveDirective.length > 0) ||
        (obj.violatedDirective && obj.violatedDirective.length > 0),
      ),
    "empty_reporting_api_body",
  );

/** Reporting API report item. */
const reportingApiItem = z.object({
  type: z.literal("csp-violation"),
  body: reportingApiBody,
  url: optionalString,
  age: optionalNonNegativeNumber,
  user_agent: optionalString,
});

const legacyEnvelope = z.object({
  "csp-report": legacyCspReportBody,
});

const reportingApiArray = z
  .array(reportingApiItem)
  .min(1)
  .max(CSP_REPORT_MAX_ARRAY);

export type CspReportPayload =
  | z.infer<typeof legacyEnvelope>
  | z.infer<typeof reportingApiItem>
  | z.infer<typeof reportingApiArray>;

function objectKeyCount(value: unknown, depth = 0): number {
  if (!value || typeof value !== "object") return 0;
  if (depth > CSP_REPORT_MAX_DEPTH) return Number.POSITIVE_INFINITY;
  const keys = Object.keys(value as object);
  if (keys.length > CSP_REPORT_MAX_OBJECT_KEYS) {
    return Number.POSITIVE_INFINITY;
  }
  let total = keys.length;
  for (const child of Object.values(value as object)) {
    total += objectKeyCount(child, depth + 1);
    if (!Number.isFinite(total)) return total;
  }
  return total;
}

function hasPrototypePollutionShape(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  // Prefer getOwnPropertyNames so JSON `__proto__` own-keys are visible
  // (object-literal `__proto__` only mutates [[Prototype]] and is not a key).
  const keys = Object.getOwnPropertyNames(value as object);
  for (const key of keys) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return true;
    }
  }
  if (Array.isArray(value)) {
    return value.some(hasPrototypePollutionShape);
  }
  return Object.values(value as object).some(hasPrototypePollutionShape);
}

/**
 * Accept intentional browser CSP report shapes:
 * - legacy `{ "csp-report": { ... } }`
 * - Reporting API item `{ type: "csp-violation", body: { ... } }`
 * - Reporting API array of those items
 *
 * Rejects `{}`, empty arrays, unsupported types, wrong field types.
 * Unknown non-standard fields are stripped (not logged, not echoed).
 */
export function parseCspReportPayload(
  payload: unknown,
):
  | { ok: true; data: CspReportPayload }
  | { ok: false; error: "invalid_report" } {
  if (payload === null || payload === undefined) {
    return { ok: false, error: "invalid_report" };
  }

  if (hasPrototypePollutionShape(payload)) {
    return { ok: false, error: "invalid_report" };
  }

  if (objectKeyCount(payload) === Number.POSITIVE_INFINITY) {
    return { ok: false, error: "invalid_report" };
  }

  if (Array.isArray(payload)) {
    if (payload.length === 0) {
      return { ok: false, error: "invalid_report" };
    }
    const parsed = reportingApiArray.safeParse(payload);
    if (!parsed.success) return { ok: false, error: "invalid_report" };
    return { ok: true, data: parsed.data };
  }

  if (typeof payload !== "object") {
    return { ok: false, error: "invalid_report" };
  }

  const keys = Object.keys(payload);
  if (keys.length === 0) {
    return { ok: false, error: "invalid_report" };
  }

  if ("csp-report" in payload) {
    const parsed = legacyEnvelope.safeParse(payload);
    if (!parsed.success) return { ok: false, error: "invalid_report" };
    return { ok: true, data: parsed.data };
  }

  if ("type" in payload) {
    const parsed = reportingApiItem.safeParse(payload);
    if (!parsed.success) return { ok: false, error: "invalid_report" };
    return { ok: true, data: parsed.data };
  }

  return { ok: false, error: "invalid_report" };
}
