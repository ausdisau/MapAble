import { z } from "zod";

/** Hard caps for CSP report payload fields (abuse / DoS bound). */
export const CSP_REPORT_MAX_STRING = 2_048;
export const CSP_REPORT_MAX_ARRAY = 20;
export const CSP_REPORT_MAX_OBJECT_KEYS = 40;

const boundedString = z.string().max(CSP_REPORT_MAX_STRING);

const legacyCspReportBody = z
  .object({
    "document-uri": boundedString.optional(),
    "blocked-uri": boundedString.optional(),
    "violated-directive": boundedString.optional(),
    "effective-directive": boundedString.optional(),
    "original-policy": boundedString.optional(),
    disposition: boundedString.optional(),
    "status-code": z.number().finite().optional(),
    "script-sample": boundedString.optional(),
  })
  .passthrough()
  .refine(
    (obj) => Object.keys(obj).length <= CSP_REPORT_MAX_OBJECT_KEYS,
    "too_many_keys",
  );

const reportingApiItem = z
  .object({
    type: boundedString.optional(),
    body: z
      .object({
        documentURL: boundedString.optional(),
        blockedURL: boundedString.optional(),
        effectiveDirective: boundedString.optional(),
        violatedDirective: boundedString.optional(),
        disposition: boundedString.optional(),
        statusCode: z.number().finite().optional(),
        sample: boundedString.optional(),
      })
      .passthrough()
      .refine(
        (obj) => Object.keys(obj).length <= CSP_REPORT_MAX_OBJECT_KEYS,
        "too_many_keys",
      )
      .optional(),
  })
  .passthrough()
  .refine(
    (obj) => Object.keys(obj).length <= CSP_REPORT_MAX_OBJECT_KEYS,
    "too_many_keys",
  );

const legacyEnvelope = z
  .object({
    "csp-report": legacyCspReportBody,
  })
  .passthrough()
  .refine(
    (obj) => Object.keys(obj).length <= CSP_REPORT_MAX_OBJECT_KEYS,
    "too_many_keys",
  );

const reportingApiArray = z
  .array(reportingApiItem)
  .min(1)
  .max(CSP_REPORT_MAX_ARRAY);

export type CspReportPayload =
  | z.infer<typeof legacyEnvelope>
  | z.infer<typeof reportingApiItem>
  | z.infer<typeof reportingApiArray>;

/**
 * Accepts legacy `{ "csp-report": ... }`, a single Reporting API item,
 * or a Reporting API array. Rejects oversized strings/arrays/objects.
 *
 * Branches explicitly so a failed legacy parse cannot fall through to a
 * permissive Reporting API object schema via `z.union`.
 */
export function parseCspReportPayload(
  payload: unknown,
):
  | { ok: true; data: CspReportPayload }
  | { ok: false; error: "invalid_report" } {
  if (Array.isArray(payload)) {
    const parsed = reportingApiArray.safeParse(payload);
    if (!parsed.success) return { ok: false, error: "invalid_report" };
    return { ok: true, data: parsed.data };
  }

  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "invalid_report" };
  }

  if ("csp-report" in payload) {
    const parsed = legacyEnvelope.safeParse(payload);
    if (!parsed.success) return { ok: false, error: "invalid_report" };
    return { ok: true, data: parsed.data };
  }

  const parsed = reportingApiItem.safeParse(payload);
  if (!parsed.success) return { ok: false, error: "invalid_report" };
  return { ok: true, data: parsed.data };
}
