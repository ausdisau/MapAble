import { z } from "zod";

/** Hard caps for CSP report payload fields (abuse / DoS bound). */
export const CSP_REPORT_MAX_STRING = 2_048;
export const CSP_REPORT_MAX_ARRAY = 20;
export const CSP_REPORT_MAX_OBJECT_KEYS = 40;
export const CSP_REPORT_MAX_DEPTH = 4;

const boundedString = z.string().max(CSP_REPORT_MAX_STRING);

const dispositionSchema = z.enum(["enforce", "report", "reporting"]);

/**
 * Known CSP directive tokens (prefix match allowed for "-elem"/"-attr" forms
 * via a conservative pattern). Browsers may send compound values.
 */
const directiveSchema = boundedString.regex(
  /^[a-z0-9-]+(?:\s+[a-z0-9-]+)?$/i,
  "invalid_directive",
);

const legacyCspReportBody = z
  .object({
    "document-uri": boundedString.optional(),
    "blocked-uri": boundedString.optional(),
    "violated-directive": directiveSchema.optional(),
    "effective-directive": directiveSchema.optional(),
    "original-policy": boundedString.optional(),
    disposition: dispositionSchema.optional(),
    "status-code": z.number().int().min(0).max(599).optional(),
    "script-sample": boundedString.optional(),
  })
  .strict()
  .refine(
    (obj) =>
      Boolean(
        obj["document-uri"] ||
        obj["blocked-uri"] ||
        obj["violated-directive"] ||
        obj["effective-directive"],
      ),
    "empty_legacy_report",
  );

const reportingApiBody = z
  .object({
    documentURL: boundedString.optional(),
    blockedURL: boundedString.optional(),
    effectiveDirective: directiveSchema.optional(),
    violatedDirective: directiveSchema.optional(),
    disposition: dispositionSchema.optional(),
    statusCode: z.number().int().min(0).max(599).optional(),
    sample: boundedString.optional(),
  })
  .strict()
  .refine(
    (obj) =>
      Boolean(
        obj.documentURL ||
        obj.blockedURL ||
        obj.effectiveDirective ||
        obj.violatedDirective,
      ),
    "empty_reporting_api_body",
  );

/** Reporting API item — type must be csp-violation; body required. */
const reportingApiItem = z
  .object({
    type: z.literal("csp-violation"),
    body: reportingApiBody,
    url: boundedString.optional(),
    age: z.number().finite().nonnegative().optional(),
  })
  .strict();

const legacyEnvelope = z
  .object({
    "csp-report": legacyCspReportBody,
  })
  .strict();

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
  for (const key of Object.keys(value as object)) {
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
 * Accepts only intentional browser CSP report shapes:
 * - legacy `{ "csp-report": { ... } }`
 * - Reporting API item `{ type: "csp-violation", body: { ... } }`
 * - Reporting API array of those items
 *
 * Rejects `{}`, unrelated objects, empty arrays, unsupported types.
 * Unknown fields are rejected (`.strict()`), not silently accepted.
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
