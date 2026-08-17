/**
 * Redact CSP violation reports for preview evidence capture.
 * Never log cookies, authorization headers, script samples, query payloads,
 * full document URLs, referrers, source files, original policies, or user-agents.
 */

export type CspViolationReport = {
  "csp-report"?: {
    "document-uri"?: string | null;
    referrer?: string | null;
    "blocked-uri"?: string | null;
    "violated-directive"?: string | null;
    "effective-directive"?: string | null;
    "original-policy"?: string | null;
    disposition?: string | null;
    "source-file"?: string | null;
    "status-code"?: number | null;
    "line-number"?: number | null;
    "column-number"?: number | null;
    "script-sample"?: string | null;
  };
  type?: string;
  url?: string | null;
  age?: number | null;
  user_agent?: string | null;
  body?: {
    documentURL?: string | null;
    referrer?: string | null;
    blockedURL?: string | null;
    effectiveDirective?: string | null;
    violatedDirective?: string | null;
    originalPolicy?: string | null;
    disposition?: string | null;
    sourceFile?: string | null;
    statusCode?: number | null;
    lineNumber?: number | null;
    columnNumber?: number | null;
    sample?: string | null;
  };
};

/** Minimum telemetry retained after redaction — no samples, policies, or full URLs. */
export type RedactedCspViolation = {
  documentOrigin: string | null;
  blockedUri: string | null;
  violatedDirective: string | null;
  disposition: string | null;
  statusCode: number | null;
};

const MAX_DIRECTIVE_LEN = 128;

function originOnly(uri: string | null | undefined): string | null {
  if (!uri) return null;
  try {
    const u = new URL(uri);
    return u.origin;
  } catch {
    if (uri === "inline" || uri === "eval" || uri.startsWith("data:")) {
      return uri.slice(0, 32);
    }
    return "unparseable";
  }
}

function truncateDirective(value: string | null | undefined): string | null {
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
        (legacy["blocked-uri"] ? legacy["blocked-uri"].slice(0, 64) : null),
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
      (reportBody.blockedURL ? reportBody.blockedURL.slice(0, 64) : null),
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
