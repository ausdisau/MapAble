/**
 * Incrementally read a Request body with a hard decoded-byte cap.
 * Cancels the stream as soon as the limit is exceeded — does not buffer
 * an unbounded body via arrayBuffer()/text()/json().
 */

export const CSP_REPORT_MAX_BODY_BYTES = 8_192;

export type BoundedBodyError =
  | "payload_too_large"
  | "empty_body"
  | "stream_error"
  | "no_body";

export type BoundedBodyResult =
  | { ok: true; bytes: Uint8Array; bytesRead: number }
  | { ok: false; error: BoundedBodyError; bytesRead: number };

export type ReadBoundedBodyOptions = {
  maxBytes: number;
  /** Optional probe for tests — called when cancel() runs after oversize. */
  onCancel?: (reason: string) => void;
};

/**
 * Read request.body with a hard cap. When Content-Length is absent or
 * dishonest, the stream still stops at maxBytes.
 */
export async function readBoundedRequestBody(
  request: Request,
  options: ReadBoundedBodyOptions,
): Promise<BoundedBodyResult> {
  const { maxBytes, onCancel } = options;
  const body = request.body;

  if (!body) {
    // Empty body in some runtimes; treat as empty rather than unbounded fallback.
    return { ok: false, error: "empty_body", bytesRead: 0 };
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let bytesRead = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;

      bytesRead += value.byteLength;
      if (bytesRead > maxBytes) {
        const reason = "payload_too_large";
        onCancel?.(reason);
        try {
          await reader.cancel(reason);
        } catch {
          /* ignore cancel races */
        }
        return { ok: false, error: "payload_too_large", bytesRead };
      }
      chunks.push(value);
    }
  } catch {
    try {
      await reader.cancel("stream_error");
    } catch {
      /* ignore */
    }
    return { ok: false, error: "stream_error", bytesRead };
  }

  if (bytesRead === 0) {
    return { ok: false, error: "empty_body", bytesRead: 0 };
  }

  const bytes = new Uint8Array(bytesRead);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return { ok: true, bytes, bytesRead };
}
