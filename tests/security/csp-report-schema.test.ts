import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseCspReportPayload } from "@/lib/security/csp-report-schema";
import {
  extractCspReports,
  redactCspViolationReport,
} from "@/lib/security/csp-violation-redact";

const fixtureDir = join(process.cwd(), "tests/security/fixtures/csp-browser");

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixtureDir, name), "utf8"));
}

const browserFixtures = [
  "chromium-legacy.json",
  "chromium-reporting-api.json",
  "firefox-legacy.json",
] as const;

describe("parseCspReportPayload — browser compatibility", () => {
  it("accepts valid legacy and Reporting API browser fixtures", () => {
    expect(
      parseCspReportPayload({
        "csp-report": {
          "document-uri": "https://example.com/",
          referrer: "",
          "blocked-uri": "inline",
          "violated-directive": "script-src-elem",
          "effective-directive": "script-src-elem",
          "original-policy": "default-src 'self'",
          disposition: "report",
          "source-file": "https://example.com/app.js",
          "status-code": 200,
          "line-number": 1,
          "column-number": 2,
          "script-sample": "alert(1)",
        },
      }).ok,
    ).toBe(true);

    expect(
      parseCspReportPayload([
        {
          age: 1,
          type: "csp-violation",
          url: "https://example.com/",
          user_agent: "synthetic-browser",
          body: {
            documentURL: "https://example.com/",
            referrer: null,
            blockedURL: "inline",
            effectiveDirective: "script-src-elem",
            violatedDirective: "script-src-elem",
            originalPolicy: "default-src 'self'",
            disposition: "report",
            sourceFile: "https://example.com/a.js",
            statusCode: 200,
            lineNumber: 10,
            columnNumber: 20,
            sample: "x",
          },
        },
      ]).ok,
    ).toBe(true);
  });

  for (const file of browserFixtures) {
    it(`accepts real-browser fixture ${file}`, () => {
      const payload = loadFixture(file);
      const parsed = parseCspReportPayload(payload);
      expect(parsed.ok, file).toBe(true);
    });

    it(`redacts sensitive fields from ${file} without leaking raw values`, () => {
      const payload = loadFixture(file);
      const parsed = parseCspReportPayload(payload);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) return;
      const reports = extractCspReports(parsed.data);
      expect(reports.length).toBeGreaterThan(0);
      for (const report of reports) {
        const redacted = redactCspViolationReport(report);
        const dumped = JSON.stringify(redacted);
        expect(dumped).not.toMatch(
          /script-sample|original-policy|user_agent|alert\(/i,
        );
        expect(dumped).not.toContain("fixture.local/csp-report");
        // Origin-only may remain; full path samples must not.
        expect(redacted).toEqual(
          expect.objectContaining({
            violatedDirective: expect.any(String),
            disposition: expect.any(String),
          }),
        );
        expect(redacted).not.toHaveProperty("script-sample");
        expect(redacted).not.toHaveProperty("originalPolicy");
        expect(redacted).not.toHaveProperty("user_agent");
      }
    });
  }

  it("strips unknown non-standard fields rather than retaining them", () => {
    const parsed = parseCspReportPayload({
      "csp-report": {
        "document-uri": "https://example.com/",
        "violated-directive": "script-src",
        "non-standard-telemetry": "secret-token",
      },
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(JSON.stringify(parsed.data)).not.toContain("secret-token");
    expect(JSON.stringify(parsed.data)).not.toContain("non-standard-telemetry");
  });

  it("rejects empty objects, unrelated objects, and empty arrays", () => {
    expect(parseCspReportPayload({}).ok).toBe(false);
    expect(parseCspReportPayload({ foo: 1 }).ok).toBe(false);
    expect(parseCspReportPayload([]).ok).toBe(false);
    expect(parseCspReportPayload({ "csp-report": {} }).ok).toBe(false);
  });

  it("rejects unsupported types and missing bodies", () => {
    expect(parseCspReportPayload({ type: "deprecation", body: {} }).ok).toBe(
      false,
    );
    expect(parseCspReportPayload({ type: "csp-violation" }).ok).toBe(false);
    expect(parseCspReportPayload({ type: "csp-violation", body: {} }).ok).toBe(
      false,
    );
  });

  it("rejects wrong field types and oversized values", () => {
    expect(
      parseCspReportPayload({
        "csp-report": {
          "document-uri": "https://example.com/",
          "status-code": "200",
        },
      }).ok,
    ).toBe(false);
    expect(
      parseCspReportPayload({
        "csp-report": {
          "document-uri": "https://example.com/",
          "violated-directive": "d".repeat(3_000),
        },
      }).ok,
    ).toBe(false);
  });

  it("rejects prototype-pollution-shaped input", () => {
    // JSON.parse creates an own `__proto__` key (unlike object-literal sugar).
    const polluted = JSON.parse(
      '{"csp-report":{"document-uri":"https://example.com/","violated-directive":"script-src"},"__proto__":{"admin":true}}',
    );
    expect(parseCspReportPayload(polluted).ok).toBe(false);
    expect(
      parseCspReportPayload({
        "csp-report": {
          "document-uri": "https://example.com/",
          "violated-directive": "script-src",
          constructor: { name: "evil" },
        },
      }).ok,
    ).toBe(false);
  });

  it("rejects mixed valid/invalid Reporting API arrays (all-or-nothing)", () => {
    expect(
      parseCspReportPayload([
        {
          type: "csp-violation",
          body: {
            documentURL: "https://example.com/",
            effectiveDirective: "script-src",
          },
        },
        { type: "csp-violation", body: {} },
      ]).ok,
    ).toBe(false);
  });
});
