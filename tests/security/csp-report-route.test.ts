import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/csp-preview-enforce", () => ({
  isCspPreviewEnforceEnabled: vi.fn(() => false),
}));

import { POST } from "@/app/api/security/csp-report/route";
import { isCspPreviewEnforceEnabled } from "@/lib/security/csp-preview-enforce";

function reportRequest(
  body: unknown,
  init?: {
    contentType?: string;
    ip?: string;
    contentLength?: string;
    rawBody?: BodyInit;
  },
): Request {
  const serialized =
    init?.rawBody !== undefined ? undefined : JSON.stringify(body);
  const headers: Record<string, string> = {
    "content-type": init?.contentType ?? "application/csp-report",
    "x-forwarded-for": init?.ip ?? "203.0.113.10",
  };
  if (init?.contentLength !== undefined) {
    headers["content-length"] = init.contentLength;
  }
  return new Request("http://localhost/api/security/csp-report", {
    method: "POST",
    headers,
    body: init?.rawBody ?? serialized,
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

  it("rejects oversized bodies with 413 after read", async () => {
    const res = await POST(
      reportRequest({
        "csp-report": {
          "document-uri": "https://example.com/",
          "original-policy": "x".repeat(10_000),
        },
      }),
    );
    expect(res.status).toBe(413);
  });

  it("rejects oversized Content-Length before buffering", async () => {
    const res = await POST(
      reportRequest(
        { "csp-report": { "document-uri": "https://example.com/" } },
        { contentLength: "9000" },
      ),
    );
    expect(res.status).toBe(413);
    const body = await res.json();
    expect(body).toEqual({ error: "payload_too_large" });
  });

  it("rejects malformed Content-Length", async () => {
    const res = await POST(
      reportRequest(
        { "csp-report": { "document-uri": "https://example.com/" } },
        { contentLength: "12abc" },
      ),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "invalid_content_length" });
  });

  it("rejects zero Content-Length", async () => {
    const res = await POST(
      reportRequest({}, { contentLength: "0", rawBody: "" }),
    );
    expect(res.status).toBe(400);
  });

  it("accepts valid body when Content-Length is absent", async () => {
    const payload = {
      "csp-report": {
        "document-uri": "https://example.com/",
        "violated-directive": "script-src",
      },
    };
    const res = await POST(
      new Request("http://localhost/api/security/csp-report", {
        method: "POST",
        headers: {
          "content-type": "application/csp-report",
          "x-forwarded-for": "203.0.113.11",
        },
        body: JSON.stringify(payload),
      }),
    );
    expect(res.status).toBe(204);
  });

  it("rejects wrong-schema payloads via Zod without echoing body", async () => {
    const res = await POST(reportRequest("not-an-object"));
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("invalid_report");
    expect(text).not.toContain("not-an-object");
  });

  it("rejects oversized string fields in schema", async () => {
    const res = await POST(
      reportRequest({
        "csp-report": {
          "document-uri": "https://example.com/",
          "violated-directive": "d".repeat(3_000),
        },
      }),
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_report" });
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
