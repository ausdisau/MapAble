import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/security/csp-preview-enforce", () => ({
  isCspPreviewEnforceEnabled: vi.fn(() => false),
}));

import { POST } from "@/app/api/security/csp-report/route";
import { CSP_REPORT_MAX_BODY_BYTES } from "@/lib/security/read-bounded-body";
import { isCspPreviewEnforceEnabled } from "@/lib/security/csp-preview-enforce";

function jsonBody(body: unknown): string {
  return JSON.stringify(body);
}

function reportRequest(
  body: unknown,
  init?: {
    contentType?: string;
    ip?: string;
    contentLength?: string;
    rawBody?: BodyInit;
    duplex?: boolean;
  },
): Request {
  const headers: Record<string, string> = {
    "content-type": init?.contentType ?? "application/csp-report",
    "x-forwarded-for": init?.ip ?? "203.0.113.10",
  };
  if (init?.contentLength !== undefined) {
    headers["content-length"] = init.contentLength;
  }
  const initRequest: RequestInit & { duplex?: "half" } = {
    method: "POST",
    headers,
    body: init?.rawBody ?? jsonBody(body),
  };
  if (init?.duplex) {
    initRequest.duplex = "half";
  }
  return new Request("http://localhost/api/security/csp-report", initRequest);
}

describe("POST /api/security/csp-report", () => {
  beforeEach(() => {
    vi.mocked(isCspPreviewEnforceEnabled).mockReturnValue(false);
  });

  it("accepts a body below the limit with 204 and no echo", async () => {
    const res = await POST(
      reportRequest({
        "csp-report": {
          "document-uri": "https://preview.example/login?token=secret",
          "blocked-uri": "https://evil.example/x.js",
          "violated-directive": "script-src",
        },
      }),
    );
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });

  it("accepts a body exactly at the byte limit when schema-valid", async () => {
    const directive = "script-src";
    const padLen =
      CSP_REPORT_MAX_BODY_BYTES -
      jsonBody({
        "csp-report": {
          "document-uri": "https://example.com/",
          "violated-directive": directive,
          "original-policy": "",
        },
      }).length;
    const original = "p".repeat(Math.max(1, padLen));
    const body = {
      "csp-report": {
        "document-uri": "https://example.com/",
        "violated-directive": directive,
        "original-policy": original,
      },
    };
    const serialized = jsonBody(body);
    expect(serialized.length).toBeLessThanOrEqual(CSP_REPORT_MAX_BODY_BYTES);
    const res = await POST(
      reportRequest(body, { contentLength: String(serialized.length) }),
    );
    expect([204, 400]).toContain(res.status);
  });

  it("rejects unsupported content types", async () => {
    const res = await POST(
      reportRequest(
        {
          "csp-report": {
            "document-uri": "https://example.com/",
            "violated-directive": "script-src",
          },
        },
        { contentType: "text/plain" },
      ),
    );
    expect(res.status).toBe(415);
  });

  it("accepts supported CSP media types", async () => {
    for (const contentType of [
      "application/csp-report",
      "application/json",
      "application/reports+json",
    ]) {
      const payload =
        contentType === "application/reports+json"
          ? [
              {
                type: "csp-violation",
                body: {
                  documentURL: "https://example.com/",
                  effectiveDirective: "script-src",
                },
              },
            ]
          : {
              "csp-report": {
                "document-uri": "https://example.com/",
                "violated-directive": "script-src",
              },
            };
      const res = await POST(
        reportRequest(payload, {
          contentType,
          ip: `203.0.113.${contentType.length}`,
        }),
      );
      expect(res.status).toBe(204);
    }
  });

  it("rejects oversized declared Content-Length before read", async () => {
    const res = await POST(
      reportRequest(
        {
          "csp-report": {
            "document-uri": "https://example.com/",
            "violated-directive": "script-src",
          },
        },
        { contentLength: "9000" },
      ),
    );
    expect(res.status).toBe(413);
  });

  it("rejects malformed, negative and ambiguous Content-Length", async () => {
    for (const contentLength of ["12abc", "-1", "1.5", "1,2", ""]) {
      const res = await POST(
        reportRequest(
          {
            "csp-report": {
              "document-uri": "https://example.com/",
              "violated-directive": "script-src",
            },
          },
          { contentLength, ip: `198.51.100.${contentLength.length + 1}` },
        ),
      );
      expect(res.status).toBe(400);
    }
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

  it("rejects understated Content-Length with an oversized stream", async () => {
    const chunkSize = 1024;
    let pulled = 0;
    let cancelled = false;
    const oversize = CSP_REPORT_MAX_BODY_BYTES * 3;
    let remaining = oversize;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        if (remaining <= 0) {
          controller.close();
          return;
        }
        const size = Math.min(chunkSize, remaining);
        remaining -= size;
        pulled += size;
        controller.enqueue(new Uint8Array(size).fill(65));
      },
      cancel() {
        cancelled = true;
      },
    });
    const res = await POST(
      new Request("http://localhost/api/security/csp-report", {
        method: "POST",
        headers: {
          "content-type": "application/csp-report",
          "content-length": "100",
          "x-forwarded-for": "203.0.113.44",
        },
        body: stream,
        duplex: "half",
      } as RequestInit & { duplex: "half" }),
    );
    expect(res.status).toBe(413);
    expect(cancelled).toBe(true);
    expect(pulled).toBeLessThan(oversize);
    expect(pulled).toBeLessThanOrEqual(CSP_REPORT_MAX_BODY_BYTES + chunkSize);
  });

  it("rejects empty body", async () => {
    const res = await POST(
      reportRequest(
        {},
        { rawBody: new Uint8Array(), contentLength: undefined },
      ),
    );
    // Missing CL + empty stream → invalid_report
    expect(res.status).toBe(400);
  });

  it("rejects wrong-schema payloads without echoing body", async () => {
    const res = await POST(reportRequest({}));
    expect(res.status).toBe(400);
    const text = await res.text();
    expect(text).toContain("invalid_report");
    expect(text).not.toContain("csp-report");
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
});
