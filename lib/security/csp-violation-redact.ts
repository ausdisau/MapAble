/**
 * Redact CSP violation reports for preview evidence capture.
 * Never log cookies, authorization headers, script samples, or query payloads.
 */

export type CspViolationReport = {
  "csp-report"?: {
    "document-uri"?: string;
    "blocked-uri"?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
    "original-policy"?: string;
    disposition?: string;
    "status-code"?: number;
    "script-sample"?: string;
  };
  // Reporting API (application/reports+json) single item body shape
  type?: string;
  body?: {
    documentURL?: string;
    blockedURL?: string;
    effectiveDirective?: string;
    violatedDirective?: string;
    disposition?: string;
    statusCode?: number;
    sample?: string;
  };
};

export type RedactedCspViolation = {
  documentOrigin: string | null;
  blockedUri: string | null;
  violatedDirective: string | null;
  disposition: string | null;
  statusCode: number | null;
};

const MAX_DIRECTIVE_LEN = 128;

function originOnly(uri: string | undefined): string | null {
  if (!uri) return null;
  try {
    const u = new URL(uri);
    return u.origin;
  } catch {
    // data:/inline/eval — keep scheme-ish token only
    if (uri === "inline" || uri === "eval" || uri.startsWith("data:")) {
      return uri.slice(0, 32);
    }
    return "unparseable";
  }
}

function truncateDirective(value: string | undefined): string | null {
  if (!value) return null;
  return value.slice(0, MAX_DIRECTIVE_LEN);
}

export function redactCspViolationReport(
  body: CspViolationReport,
): RedactedCspViolation {
  const legacy = body["csp-report"];
  if (legacy) {
    return {
      documentOrigin: originOnly(legacy["document-uri"]),
      blockedUri:
        originOnly(legacy["blocked-uri"]) ??
        legacy["blocked-uri"]?.slice(0, 64) ??
        null,
      violatedDirective: truncateDirective(
        legacy["violated-directive"] ?? legacy["effective-directive"],
      ),
      disposition: legacy.disposition?.slice(0, 32) ?? null,
      statusCode:
        typeof legacy["status-code"] === "number"
          ? legacy["status-code"]
          : null,
    };
  }

  const reportBody = body.body ?? {};
  return {
    documentOrigin: originOnly(reportBody.documentURL),
    blockedUri:
      originOnly(reportBody.blockedURL) ??
      reportBody.blockedURL?.slice(0, 64) ??
      null,
    violatedDirective: truncateDirective(
      reportBody.violatedDirective ?? reportBody.effectiveDirective,
    ),
    disposition: reportBody.disposition?.slice(0, 32) ?? null,
    statusCode:
      typeof reportBody.statusCode === "number" ? reportBody.statusCode : null,
  };
}

/** Normalize JSON body that may be a single report or Reporting API array. */
export function extractCspReports(payload: unknown): CspViolationReport[] {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is CspViolationReport => !!item && typeof item === "object",
    );
  }
  if (payload && typeof payload === "object") {
    return [payload as CspViolationReport];
  }
  return [];
}
