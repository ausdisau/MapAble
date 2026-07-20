/**
 * Redact CSP violation reports for preview evidence capture.
 * Never log cookies, authorization headers, or participant query payloads.
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
};

export type RedactedCspViolation = {
  documentOrigin: string | null;
  blockedUri: string | null;
  violatedDirective: string | null;
  disposition: string | null;
  statusCode: number | null;
};

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

export function redactCspViolationReport(
  body: CspViolationReport,
): RedactedCspViolation {
  const report = body["csp-report"] ?? {};
  return {
    documentOrigin: originOnly(report["document-uri"]),
    blockedUri:
      originOnly(report["blocked-uri"]) ??
      report["blocked-uri"]?.slice(0, 64) ??
      null,
    violatedDirective:
      report["violated-directive"] ?? report["effective-directive"] ?? null,
    disposition: report.disposition ?? null,
    statusCode:
      typeof report["status-code"] === "number" ? report["status-code"] : null,
  };
}
