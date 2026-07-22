import { describe, expect, it } from "vitest";

import { parseCspReportPayload } from "@/lib/security/csp-report-schema";

const validLegacy = {
  "csp-report": {
    "document-uri": "https://example.com/page",
    "blocked-uri": "https://evil.example/x.js",
    "violated-directive": "script-src",
    disposition: "report",
  },
};

const validReportingApi = {
  type: "csp-violation",
  body: {
    documentURL: "https://example.com/page",
    blockedURL: "inline",
    effectiveDirective: "script-src",
    disposition: "report",
  },
};

describe("parseCspReportPayload", () => {
  it("accepts valid legacy and Reporting API browser fixtures", () => {
    expect(parseCspReportPayload(validLegacy).ok).toBe(true);
    expect(parseCspReportPayload(validReportingApi).ok).toBe(true);
    expect(parseCspReportPayload([validReportingApi]).ok).toBe(true);
  });

  it("rejects empty objects, unrelated objects, and empty arrays", () => {
    expect(parseCspReportPayload({}).ok).toBe(false);
    expect(parseCspReportPayload({ foo: 1 }).ok).toBe(false);
    expect(parseCspReportPayload([]).ok).toBe(false);
    expect(parseCspReportPayload({ "csp-report": {} }).ok).toBe(false);
  });

  it("rejects unsupported types and missing bodies", () => {
    expect(
      parseCspReportPayload({ type: "deprecation", body: {} }).ok,
    ).toBe(false);
    expect(parseCspReportPayload({ type: "csp-violation" }).ok).toBe(false);
    expect(
      parseCspReportPayload({ type: "csp-violation", body: {} }).ok,
    ).toBe(false);
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

  it("rejects unknown fields (strict) and prototype-pollution shapes", () => {
    expect(
      parseCspReportPayload({
        "csp-report": {
          "document-uri": "https://example.com/",
          unexpected: true,
        },
      }).ok,
    ).toBe(false);
    expect(
      parseCspReportPayload({
        "csp-report": { "document-uri": "https://example.com/" },
        __proto__: { admin: true },
      }).ok,
    ).toBe(false);
  });

  it("rejects mixed valid/invalid Reporting API arrays", () => {
    expect(
      parseCspReportPayload([
        validReportingApi,
        { type: "csp-violation", body: {} },
      ]).ok,
    ).toBe(false);
  });

  it("rejects nested objects beyond depth/key bounds", () => {
    expect(
      parseCspReportPayload({
        "csp-report": {
          "document-uri": "https://example.com/",
          nested: { a: { b: { c: { d: 1 } } } },
        },
      }).ok,
    ).toBe(false);
  });
});
