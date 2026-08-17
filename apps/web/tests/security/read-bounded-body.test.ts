import { describe, expect, it } from "vitest";

import {
  CSP_REPORT_MAX_BODY_BYTES,
  readBoundedRequestBody,
} from "@/lib/security/read-bounded-body";

function streamRequest(
  totalBytes: number,
  chunkSize: number,
  headers?: Record<string, string>,
): {
  request: Request;
  bytesPulled: { value: number };
  cancelled: { value: boolean };
} {
  let remaining = totalBytes;
  const bytesPulled = { value: 0 };
  const cancelled = { value: false };
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (remaining <= 0) {
        controller.close();
        return;
      }
      const size = Math.min(chunkSize, remaining);
      const chunk = new Uint8Array(size).fill(65);
      remaining -= size;
      bytesPulled.value += size;
      controller.enqueue(chunk);
    },
    cancel() {
      cancelled.value = true;
    },
  });
  return {
    request: new Request("http://localhost/api/security/csp-report", {
      method: "POST",
      headers: {
        "content-type": "application/csp-report",
        ...headers,
      },
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" }),
    bytesPulled,
    cancelled,
  };
}

describe("readBoundedRequestBody", () => {
  it("accepts a body below the limit", async () => {
    const { request } = streamRequest(100, 50);
    const result = await readBoundedRequestBody(request, {
      maxBytes: CSP_REPORT_MAX_BODY_BYTES,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.bytesRead).toBe(100);
  });

  it("accepts a body exactly at the limit", async () => {
    const { request } = streamRequest(CSP_REPORT_MAX_BODY_BYTES, 1024);
    const result = await readBoundedRequestBody(request, {
      maxBytes: CSP_REPORT_MAX_BODY_BYTES,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.bytesRead).toBe(CSP_REPORT_MAX_BODY_BYTES);
  });

  it("rejects an oversized stream and cancels before buffering the full body", async () => {
    const oversize = CSP_REPORT_MAX_BODY_BYTES * 4;
    const chunkSize = 1024;
    const { request, bytesPulled, cancelled } = streamRequest(
      oversize,
      chunkSize,
    );
    let cancelReason: string | undefined;
    const result = await readBoundedRequestBody(request, {
      maxBytes: CSP_REPORT_MAX_BODY_BYTES,
      onCancel: (reason) => {
        cancelReason = reason;
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("payload_too_large");
    expect(cancelReason).toBe("payload_too_large");
    expect(cancelled.value).toBe(true);
    // Must stop near the limit — not pull the entire oversized body.
    expect(bytesPulled.value).toBeLessThanOrEqual(
      CSP_REPORT_MAX_BODY_BYTES + chunkSize,
    );
    expect(bytesPulled.value).toBeLessThan(oversize);
  });

  it("rejects empty body", async () => {
    const { request } = streamRequest(0, 1);
    const result = await readBoundedRequestBody(request, {
      maxBytes: CSP_REPORT_MAX_BODY_BYTES,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("empty_body");
  });

  it("surfaces stream errors without leaking details", async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull() {
        throw new Error("disk secret=/etc/passwd");
      },
    });
    const request = new Request("http://localhost/x", {
      method: "POST",
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" });
    const result = await readBoundedRequestBody(request, {
      maxBytes: CSP_REPORT_MAX_BODY_BYTES,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("stream_error");
  });
});
