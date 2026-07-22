import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";

import { buildForwardRequestHeaders } from "@/lib/security/forward-request-headers";
import {
  classifySafeError,
  CORRELATION_ID_HEADER,
  createCorrelationId,
  REQUEST_ID_HEADER,
  resolveCorrelationId,
} from "@/lib/security/request-correlation";

describe("request correlation", () => {
  it("creates and resolves correlation ids safely", () => {
    const id = createCorrelationId();
    expect(id.length).toBeGreaterThan(8);
    expect(resolveCorrelationId(id)).toBe(id);
    expect(resolveCorrelationId("bad id with spaces")).not.toBe(
      "bad id with spaces",
    );
  });

  it("forwards the resolved correlation id on request headers", () => {
    const request = new NextRequest("http://localhost/about", {
      headers: {
        [CORRELATION_ID_HEADER]: "bad id with spaces",
      },
    });
    const safeId = resolveCorrelationId(
      request.headers.get(CORRELATION_ID_HEADER),
    );
    expect(safeId).not.toBe("bad id with spaces");
    const forwarded = buildForwardRequestHeaders(request, "nonce", null, safeId);
    expect(forwarded.get(CORRELATION_ID_HEADER)).toBe(safeId);
    expect(forwarded.get(REQUEST_ID_HEADER)).toBe(safeId);
    expect(forwarded.get(CORRELATION_ID_HEADER)).not.toMatch(/[\r\n]/);
  });

  it("classifies errors without leaking messages", () => {
    expect(classifySafeError({ status: 401, name: "AuthError" })).toBe(
      "auth_failure",
    );
    expect(classifySafeError({ status: 429 })).toBe("rate_limited");
    expect(classifySafeError({ status: 503, name: "Timeout" })).toBe(
      "dependency_unavailable",
    );
    expect(classifySafeError(new Error("postgres://user:pass@host/db"))).toBe(
      "internal",
    );
  });
});
