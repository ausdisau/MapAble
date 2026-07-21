import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/csp-preview-enforce", () => ({
  isCspPreviewEnforceEnabled: vi.fn(() => false),
}));

import { POST } from "@/app/api/security/csp-report/route";
import { isCspPreviewEnforceEnabled } from "@/lib/security/csp-preview-enforce";

function reportRequest(
  body: unknown,
  init?: { contentType?: string; ip?: string },
): Request {
  return new Request("http://localhost/api/security/csp-report", {
    method: "POST",
    headers: {
      "content-type": init?.contentType ?? "application/csp-report",
      "x-forwarded-for": init?.ip ?? "203.0.113.10",
    },
    body: JSON.stringify(body),
  });
}

describe("POST /api/security/csp-report", () => {
  beforeEach(() => {
    vi.mocked(isCspPreviewEnforceEnabled).mockReturnValue(false);
  });

  it("accepts a redacted legacy csp-report with 204", async () => {
    const res = await POST(
      reportRequest({
        "csp-report": {
          "document-uri": "https://preview.example/login?token=secret",
          "blocked-uri": "https://evil.example/x.js",
          "violated-directive": "script-src",
          "script-sample": "alert(1)",
        },
      }),
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("rejects unsupported content types", async () => {
    const res = await POST(
      reportRequest({ "csp-report": {} }, { contentType: "text/plain" }),
    );
    expect(res.status).toBe(415);
  });

  it("rejects oversized bodies", async () => {
    const res = await POST(
      reportRequest({
        "csp-report": {
          "document-uri": "https://example.com/",
          "original-policy": "x".repeat(10_000),
        },
      }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts Reporting API arrays", async () => {
    const res = await POST(
      reportRequest(
        [
          {
            type: "csp-violation",
            body: {
              documentURL: "https://preview.example/",
              blockedURL: "inline",
              effectiveDirective: "script-src",
            },
          },
        ],
        { contentType: "application/reports+json" },
      ),
    );
    expect(res.status).toBe(204);
  });
});
