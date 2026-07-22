import { describe, expect, it } from "vitest";

import { parseCspReportPayload } from "@/lib/security/csp-report-schema";

describe("parseCspReportPayload", () => {
  it("accepts legacy and Reporting API shapes", () => {
    expect(
      parseCspReportPayload({
        "csp-report": { "document-uri": "https://example.com/" },
      }).ok,
    ).toBe(true);
    expect(
      parseCspReportPayload([
        {
          type: "csp-violation",
          body: { documentURL: "https://example.com/" },
        },
      ]).ok,
    ).toBe(true);
  });

  it("rejects primitives and oversized arrays", () => {
    expect(parseCspReportPayload("x").ok).toBe(false);
    expect(parseCspReportPayload(null).ok).toBe(false);
    expect(
      parseCspReportPayload(
        Array.from({ length: 21 }, () => ({
          type: "csp-violation",
          body: {},
        })),
      ).ok,
    ).toBe(false);
  });
});
